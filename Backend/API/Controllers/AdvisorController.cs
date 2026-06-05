using System;
using System.Collections.Generic;
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
[Route("api/[controller]")]
[Authorize(Roles = "AcademicAdvisor")]
public class AdvisorController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBlobService _blob;

    public AdvisorController(AppDbContext db, IBlobService blob)
    {
        _db = db;
        _blob = blob;
    }

    private Guid CurrentUserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/advisor/students
    [HttpGet("students")]
    public async Task<IActionResult> GetStudents()
    {
        var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(currentUserEmail))
            return BadRequest("Advisor email claim not found.");

        var profiles = await _db.StudentProfiles
            .Include(p => p.Student)
            .Where(p => p.AdvisorEmail.ToLower() == currentUserEmail.Trim().ToLower())
            .ToListAsync();

        var result = new List<object>();

        foreach (var p in profiles)
        {
            var photoSas = await _blob.GetPresignedUrlAsync(p.ProfilePhotoUrl, 60);
            var passportSas = await _blob.GetPresignedUrlAsync(p.PassportBlobUrl, 60);
            var visaSas = await _blob.GetPresignedUrlAsync(p.VisaBlobUrl, 60);
            var transcriptSas = await _blob.GetPresignedUrlAsync(p.TranscriptBlobUrl, 60);

            PassportOcrResultDto? passportOcr = null;
            if (p.PassportOcrJson != null)
            {
                passportOcr = JsonSerializer.Deserialize<PassportOcrResultDto>(p.PassportOcrJson);
            }

            TranscriptOcrResultDto? transcriptOcr = null;
            if (p.TranscriptOcrJson != null)
            {
                transcriptOcr = JsonSerializer.Deserialize<TranscriptOcrResultDto>(p.TranscriptOcrJson);
            }

            result.Add(new
            {
                StudentId = p.StudentId,
                StudentName = p.Student.FullName,
                StudentEmail = p.Student.Email,
                MatricNumber = p.MatricNumber,
                Faculty = p.Faculty,
                Programme = p.Programme,
                PhoneNumber = p.PhoneNumber,
                CurrentYear = p.CurrentYear,
                VisaType = p.VisaType,
                PassportNumber = p.PassportNumber,
                PassportExpiry = p.PassportExpiry,
                VisaExpiry = p.VisaExpiry,
                TranscriptUploaded = p.TranscriptUploaded,
                PassportUploaded = p.PassportUploaded,
                VisaUploaded = p.VisaUploaded,
                ProfilePhotoUrl = photoSas,
                PassportBlobUrl = passportSas,
                VisaBlobUrl = visaSas,
                TranscriptBlobUrl = transcriptSas,
                AdvisorStatus = p.AdvisorStatus.ToString(),
                PassportOcrConfirmed = p.PassportOcrConfirmed,
                PassportOcrData = passportOcr,
                TranscriptOcrData = transcriptOcr,
                TranscriptOcrConfirmed = p.TranscriptOcrConfirmed
            });
        }

        return Ok(result);
    }

    // POST /api/advisor/students/add
    [HttpPost("students/add")]
    public async Task<IActionResult> AddStudent(AddStudentRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.StudentEmail))
            return BadRequest("Student email is required.");

        var student = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.StudentEmail.Trim().ToLower() && u.Role == UserRole.Student);

        if (student == null)
            return NotFound("Student not found.");

        var profile = await _db.StudentProfiles
            .FirstOrDefaultAsync(p => p.StudentId == student.Id);

        var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value;

        if (profile == null)
        {
            profile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                StudentId = student.Id,
                AdvisorEmail = currentUserEmail,
                AdvisorStatus = AdvisorStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.StudentProfiles.Add(profile);
        }
        else
        {
            profile.AdvisorEmail = currentUserEmail;
            profile.AdvisorStatus = AdvisorStatus.Pending;
            profile.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(profile);
    }

    // POST /api/advisor/students/{studentId}/accept
    [HttpPost("students/{studentId}/accept")]
    public async Task<IActionResult> AcceptStudent(Guid studentId)
    {
        var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(currentUserEmail))
            return BadRequest("Advisor email claim not found.");

        var profile = await _db.StudentProfiles
            .FirstOrDefaultAsync(p => p.StudentId == studentId && p.AdvisorEmail.ToLower() == currentUserEmail.ToLower());

        if (profile == null)
            return NotFound("Student not found under your supervision.");

        profile.AdvisorStatus = AdvisorStatus.Accepted;
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Supervision request accepted." });
    }

    // POST /api/advisor/students/{studentId}/reject
    [HttpPost("students/{studentId}/reject")]
    public async Task<IActionResult> RejectStudent(Guid studentId)
    {
        var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(currentUserEmail))
            return BadRequest("Advisor email claim not found.");

        var profile = await _db.StudentProfiles
            .FirstOrDefaultAsync(p => p.StudentId == studentId && p.AdvisorEmail.ToLower() == currentUserEmail.ToLower());

        if (profile == null)
            return NotFound("Student not found under your supervision.");

        profile.AdvisorStatus = AdvisorStatus.Rejected;
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Supervision request rejected." });
    }
}

public class AddStudentRequestDto
{
    public string StudentEmail { get; set; } = string.Empty;
}
