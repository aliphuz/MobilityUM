using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/applications")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWorkflowService _workflow;
    private readonly INotificationService _notification;
    private readonly IBlobService _blob;

    public ApplicationsController(
        AppDbContext db,
        IWorkflowService workflow,
        INotificationService notification,
        IBlobService blob)
    {
        _db = db;
        _workflow = workflow;
        _notification = notification;
        _blob = blob;
    }

    private Guid CurrentUserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // POST /api/applications — Student submits application
    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Submit(CreateApplicationDto dto)
    {
        var program = await _db.MobilityPrograms.FindAsync(dto.ProgramId);
        if (program == null) return NotFound("Program not found.");
        if (!program.IsActive) return BadRequest("Program is no longer active.");

        var existing = await _db.MobilityApplications
            .AnyAsync(a => a.StudentId == CurrentUserId
                        && a.ProgramId == dto.ProgramId);
        if (existing) return BadRequest("You already applied to this program.");

        var profile = await _db.StudentProfiles
            .FirstOrDefaultAsync(p => p.StudentId == CurrentUserId);

        if (profile == null)
            return BadRequest("You must set up your profile before applying.");

        // At least one document must be uploaded
        bool hasPassport = profile.PassportUploaded;
        bool hasVisa = profile.VisaUploaded;
        if (!hasPassport && !hasVisa)
            return BadRequest(new { message = "You must upload at least one document (Passport or Visa) before applying." });

        var requiredValidity = program.ApplicationDeadline.ToUniversalTime().AddMonths(6);

        // Only validate expiry for documents that were actually uploaded
        if (hasPassport && profile.PassportExpiry.HasValue)
        {
            if (profile.PassportExpiry.Value.ToUniversalTime() < requiredValidity)
                return BadRequest(new { message = "Your passport must be valid for at least 6 months beyond the program application deadline." });
        }

        if (hasVisa && profile.VisaExpiry.HasValue)
        {
            if (profile.VisaExpiry.Value.ToUniversalTime() < requiredValidity)
                return BadRequest(new { message = "Your visa must be valid for at least 6 months beyond the program application deadline." });
        }

        // All checks passed — create application
        var application = new MobilityApplication
        {
            Id = Guid.NewGuid(),
            StudentId = CurrentUserId,
            ProgramId = dto.ProgramId,
            Status = ApplicationStatus.Draft
        };

        var nextStatus = _workflow.GetNextStatus(
            ApplicationStatus.Draft,
            program.DurationType,
            approve: true);

        application.Status = nextStatus;

        var log = new ApprovalLog
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            ActorId = CurrentUserId,
            FromStatus = ApplicationStatus.Draft,
            ToStatus = nextStatus,
            Remark = "Application submitted by student."
        };

        _db.MobilityApplications.Add(application);
        _db.ApprovalLogs.Add(log);
        await _db.SaveChangesAsync();

        await NotifyNextReviewer(nextStatus, application.Id);

        return Ok(new { applicationId = application.Id, status = nextStatus.ToString() });
    }

    // GET /api/applications — Get applications (role-filtered)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var currentUserEmail = User.FindFirstValue(ClaimTypes.Email) ?? "";

        var query = _db.MobilityApplications
            .Include(a => a.Student)
                .ThenInclude(s => s.Profile)
            .Include(a => a.Program)
            .Include(a => a.ApprovalLogs)
                .ThenInclude(l => l.Actor)
            .AsQueryable();

        query = role switch
        {
            "Student" => query.Where(a => a.StudentId == CurrentUserId),
            "AcademicAdvisor" => query.Where(a =>
                a.Status == ApplicationStatus.Pending_AcademicAdvisor &&
                a.Student.Profile != null &&
                a.Student.Profile.AdvisorEmail.ToLower() == currentUserEmail.ToLower()),
            "TdhepAdmin" => query,
            _ => query.Where(a => false)
        };

        var applications = await query
            .OrderByDescending(a => a.UpdatedAt)
            .ToListAsync();

        var result = new List<ApplicationResponseDto>();
        foreach (var a in applications)
        {
            var profile = a.Student.Profile;
            PassportOcrResultDto? passportOcr = null;
            TranscriptOcrResultDto? transcriptOcr = null;

            if (profile != null)
            {
                if (profile.PassportOcrJson != null)
                {
                    try
                    {
                        passportOcr = JsonSerializer.Deserialize<PassportOcrResultDto>(profile.PassportOcrJson);
                    }
                    catch { }
                }
                if (profile.TranscriptOcrJson != null)
                {
                    try
                    {
                        transcriptOcr = JsonSerializer.Deserialize<TranscriptOcrResultDto>(profile.TranscriptOcrJson);
                    }
                    catch { }
                }
            }

            result.Add(new ApplicationResponseDto
            {
                Id = a.Id,
                StudentId = a.StudentId,
                StudentName = a.Student.FullName,
                StudentEmail = a.Student.Email,
                ProgramName = a.Program.Name,
                DestinationCountry = a.Program.DestinationCountry,
                DurationType = a.Program.DurationType.ToString(),
                Status = a.Status.ToString(),
                SubmittedAt = a.SubmittedAt,
                UpdatedAt = a.UpdatedAt,
                StudentPassportOcrData = passportOcr,
                StudentTranscriptOcrData = transcriptOcr,
                ApprovalLogs = a.ApprovalLogs
                    .OrderBy(l => l.Timestamp)
                    .Select(l => new ApprovalLogDto
                    {
                        Id = l.Id,
                        ActorName = l.Actor.FullName,
                        ActorRole = l.Actor.Role.ToString(),
                        FromStatus = l.FromStatus.ToString(),
                        ToStatus = l.ToStatus.ToString(),
                        Remark = l.Remark,
                        Timestamp = l.Timestamp
                    }).ToList()
            });
        }

        return Ok(result);
    }

    // POST /api/applications/{id}/review — Advisor or TDHEP reviews
    [HttpPost("{id}/review")]
    [Authorize(Roles = "AcademicAdvisor,TdhepAdmin")]
    public async Task<IActionResult> Review(Guid id, ReviewApplicationDto dto)
    {
        var application = await _db.MobilityApplications
            .Include(a => a.Program)
            .Include(a => a.Student)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application == null) return NotFound();

        var role = User.FindFirstValue(ClaimTypes.Role);

        // Guard: Advisor can only review Pending_AcademicAdvisor
        if (role == "AcademicAdvisor" &&
            application.Status != ApplicationStatus.Pending_AcademicAdvisor)
            return BadRequest("This application is not pending your review.");

        // Guard: TDHEP can only review Pending_TDHEP
        if (role == "TdhepAdmin" &&
            application.Status != ApplicationStatus.Pending_TDHEP)
            return BadRequest("This application is not pending TDHEP review.");

        var fromStatus = application.Status;
        var nextStatus = _workflow.GetNextStatus(
            fromStatus,
            application.Program.DurationType,
            dto.Approved);

        application.Status = nextStatus;
        application.UpdatedAt = DateTime.UtcNow;
        if (!dto.Approved) application.RejectionRemark = dto.Remark;

        var log = new ApprovalLog
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            ActorId = CurrentUserId,
            FromStatus = fromStatus,
            ToStatus = nextStatus,
            Remark = dto.Remark
        };

        _db.ApprovalLogs.Add(log);
        await _db.SaveChangesAsync();

        // Notify student of outcome
        await _notification.SendAsync(
            application.Student.Email,
            $"Mobility Application Update — {nextStatus}",
            $"<p>Dear {application.Student.FullName},</p>" +
            $"<p>Your application for <b>{application.Program.Name}</b> " +
            $"has been updated to: <b>{nextStatus}</b>.</p>" +
            $"<p>Remark: {dto.Remark ?? "None"}</p>");

        return Ok(new { status = nextStatus.ToString() });
    }

    // POST /api/applications/{id}/override — TDHEP manual override
    [HttpPost("{id}/override")]
    [Authorize(Roles = "TdhepAdmin")]
    public async Task<IActionResult> Override(Guid id, ReviewApplicationDto dto)
    {
        var application = await _db.MobilityApplications
            .Include(a => a.Student)
            .Include(a => a.Program)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application == null) return NotFound();
        if (string.IsNullOrWhiteSpace(dto.Remark))
            return BadRequest("A remark is required for manual overrides.");

        var fromStatus = application.Status;
        var toStatus = dto.Approved ? ApplicationStatus.Approved : ApplicationStatus.Rejected;

        application.Status = toStatus;
        application.UpdatedAt = DateTime.UtcNow;

        _db.ApprovalLogs.Add(new ApprovalLog
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            ActorId = CurrentUserId,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            Remark = $"[MANUAL OVERRIDE] {dto.Remark}"
        });

        await _db.SaveChangesAsync();
        return Ok(new { status = toStatus.ToString() });
    }

    private async Task NotifyNextReviewer(ApplicationStatus status, Guid applicationId)
    {
        if (status == ApplicationStatus.Pending_AcademicAdvisor)
        {
            var app = await _db.MobilityApplications
                .Include(a => a.Student)
                    .ThenInclude(s => s.Profile)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            var advisorEmail = app?.Student?.Profile?.AdvisorEmail;
            if (!string.IsNullOrEmpty(advisorEmail))
            {
                await _notification.SendAsync(advisorEmail,
                    "New Mobility Application Pending Your Review",
                    $"<p>A new student mobility application from {app.Student.FullName} requires your review.</p>" +
                    $"<p>Please log in to the system to review it.</p>");
            }
            else
            {
                var advisors = await _db.Users
                    .Where(u => u.Role == UserRole.AcademicAdvisor)
                    .ToListAsync();
                foreach (var advisor in advisors)
                    await _notification.SendAsync(advisor.Email,
                        "New Mobility Application Pending Your Review",
                        $"<p>A new student mobility application requires your review.</p>" +
                        $"<p>Please log in to the system to review it.</p>");
            }
        }
        else if (status == ApplicationStatus.Pending_TDHEP)
        {
            var admins = await _db.Users
                .Where(u => u.Role == UserRole.TdhepAdmin)
                .ToListAsync();
            foreach (var admin in admins)
                await _notification.SendAsync(admin.Email,
                    "New Mobility Application Pending TDHEP Review",
                    $"<p>A mobility application has reached the TDHEP stage.</p>" +
                    $"<p>Please log in to the system to review it.</p>");
        }
    }
}