using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Application.DTOs;
using Application.Interfaces;
using ClosedXML.Excel;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProgramsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBlobService _blob;

    public ProgramsController(AppDbContext db, IBlobService blob)
    {
        _db = db;
        _blob = blob;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var programs = await _db.MobilityPrograms
            .Where(p => p.IsActive)
            .OrderBy(p => p.ApplicationDeadline)
            .ToListAsync();

        var result = new List<MobilityProgram>();
        foreach (var p in programs)
        {
            var sasUrl = await _blob.GetPresignedUrlAsync(p.ImageUrl, 60);
            result.Add(new MobilityProgram
            {
                Id = p.Id,
                Name = p.Name,
                DestinationCountry = p.DestinationCountry,
                HostUniversity = p.HostUniversity,
                DurationType = p.DurationType,
                Quota = p.Quota,
                ApplicationDeadline = p.ApplicationDeadline,
                IsActive = p.IsActive,
                ImageUrl = sasUrl
            });
        }
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var program = await _db.MobilityPrograms
            .Include(p => p.Applications)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (program == null) return NotFound("Program not found.");

        var totalApplications = program.Applications.Count;
        var totalAccepted = program.Applications.Count(a => a.Status == ApplicationStatus.Approved);
        var slotsRemaining = Math.Max(0, program.Quota - totalAccepted);

        var sasUrl = await _blob.GetPresignedUrlAsync(program.ImageUrl, 60);

        return Ok(new MobilityProgramDto
        {
            Id = program.Id,
            Name = program.Name,
            DestinationCountry = program.DestinationCountry,
            HostUniversity = program.HostUniversity,
            DurationType = program.DurationType,
            Quota = program.Quota,
            ApplicationDeadline = program.ApplicationDeadline,
            IsActive = program.IsActive,
            ImageUrl = sasUrl,
            TotalApplications = totalApplications,
            TotalAccepted = totalAccepted,
            SlotsRemaining = slotsRemaining
        });
    }

    [HttpPost]
    [Authorize(Roles = "TdhepAdmin")]
    public async Task<IActionResult> Create(CreateProgramDto dto)
    {
        if (!Enum.TryParse<ProgramDurationType>(dto.DurationType, out var durationType))
            return BadRequest("Invalid DurationType. Use: ShortTerm or LongTerm");

        var program = new MobilityProgram
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            DestinationCountry = dto.DestinationCountry,
            HostUniversity = dto.HostUniversity,
            DurationType = durationType,
            Quota = dto.Quota,
            ApplicationDeadline = dto.ApplicationDeadline
        };

        _db.MobilityPrograms.Add(program);
        await _db.SaveChangesAsync();
        return Ok(program);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "TdhepAdmin")]
    public async Task<IActionResult> Update(Guid id, UpdateProgramDto dto)
    {
        var program = await _db.MobilityPrograms.FindAsync(id);
        if (program == null) return NotFound("Program not found.");

        if (!Enum.TryParse<ProgramDurationType>(dto.DurationType, out var durationType))
            return BadRequest("Invalid DurationType. Use: ShortTerm or LongTerm");

        program.Name = dto.Name;
        program.DestinationCountry = dto.DestinationCountry;
        program.HostUniversity = dto.HostUniversity;
        program.DurationType = durationType;
        program.Quota = dto.Quota;
        program.ApplicationDeadline = dto.ApplicationDeadline;

        await _db.SaveChangesAsync();
        return Ok(program);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "TdhepAdmin")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var program = await _db.MobilityPrograms.FindAsync(id);
        if (program == null) return NotFound();
        program.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok();
    }

    // POST /api/programs/{id}/image — upload a program banner image
    [HttpPost("{id}/image")]
    [Authorize(Roles = "TdhepAdmin")]
    public async Task<IActionResult> UploadProgramImage(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        var program = await _db.MobilityPrograms.FindAsync(id);
        if (program == null) return NotFound();

        using var stream = file.OpenReadStream();
        var imageUrl = await _blob.UploadAsync(stream, file.FileName, file.ContentType);
        program.ImageUrl = imageUrl;
        await _db.SaveChangesAsync();

        var sasUrl = await _blob.GetPresignedUrlAsync(imageUrl, 60);

        return Ok(new { imageUrl = sasUrl, message = "Program image uploaded." });
    }

    // GET /api/programs/{id}/students — accepted students for a program
    [HttpGet("{id}/students")]
    [Authorize(Roles = "TdhepAdmin,MobilityUniversity")]
    public async Task<IActionResult> GetAcceptedStudents(Guid id)
    {
        var program = await _db.MobilityPrograms.FindAsync(id);
        if (program == null) return NotFound();

        var accepted = await _db.MobilityApplications
            .Include(a => a.Student)
                .ThenInclude(s => s.Profile)
            .Where(a => a.ProgramId == id && a.Status == ApplicationStatus.Approved)
            .ToListAsync();

        var studentsList = new List<object>();

        foreach (var a in accepted)
        {
            var p = a.Student.Profile;
            string? advisorName = null;
            string? advisorEmail = p?.AdvisorEmail;

            if (p != null && !string.IsNullOrEmpty(p.AdvisorEmail))
            {
                var advisor = await _db.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == p.AdvisorEmail.ToLower() && u.Role == Domain.Enums.UserRole.AcademicAdvisor);
                advisorName = advisor?.FullName;
            }

            var photoSas = p != null ? await _blob.GetPresignedUrlAsync(p.ProfilePhotoUrl, 60) : null;
            var passportSas = p != null ? await _blob.GetPresignedUrlAsync(p.PassportBlobUrl, 60) : null;
            var visaSas = p != null ? await _blob.GetPresignedUrlAsync(p.VisaBlobUrl, 60) : null;
            var transcriptSas = p != null ? await _blob.GetPresignedUrlAsync(p.TranscriptBlobUrl, 60) : null;

            PassportOcrResultDto? passportOcr = null;
            if (p?.PassportOcrJson != null)
            {
                try { passportOcr = JsonSerializer.Deserialize<PassportOcrResultDto>(p.PassportOcrJson); } catch {}
            }

            TranscriptOcrResultDto? transcriptOcr = null;
            if (p?.TranscriptOcrJson != null)
            {
                try { transcriptOcr = JsonSerializer.Deserialize<TranscriptOcrResultDto>(p.TranscriptOcrJson); } catch {}
            }

            studentsList.Add(new
            {
                ApplicationId = a.Id,
                StudentName = a.Student.FullName,
                StudentEmail = a.Student.Email,
                MatricNumber = p?.MatricNumber,
                Faculty = p?.Faculty,
                Programme = p?.Programme,
                PhoneNumber = p?.PhoneNumber,
                PassportNumber = p?.PassportNumber,
                PassportExpiry = p?.PassportExpiry,
                VisaExpiry = p?.VisaExpiry,
                AdvisorEmail = advisorEmail,
                AdvisorName = advisorName,
                ApprovedAt = a.UpdatedAt,
                ProfilePhotoUrl = photoSas,
                PassportBlobUrl = passportSas,
                VisaBlobUrl = visaSas,
                TranscriptBlobUrl = transcriptSas,
                PassportOcrData = passportOcr,
                TranscriptOcrData = transcriptOcr,
                TranscriptOcrConfirmed = p?.TranscriptOcrConfirmed ?? false
            });
        }

        var programImageUrlSas = await _blob.GetPresignedUrlAsync(program.ImageUrl, 60);

        return Ok(new
        {
            Program = new
            {
                program.Id,
                program.Name,
                program.DestinationCountry,
                program.HostUniversity,
                program.DurationType,
                program.Quota,
                program.ApplicationDeadline,
                ImageUrl = programImageUrlSas
            },
            TotalAccepted = accepted.Count,
            Students = studentsList
        });
    }

    [HttpGet("{id}/export")]
    [Authorize(Roles = "TdhepAdmin,MobilityUniversity")]
    public async Task<IActionResult> ExportAcceptedStudents(Guid id)
    {
        var program = await _db.MobilityPrograms.FindAsync(id);
        if (program == null) return NotFound();

        var accepted = await _db.MobilityApplications
            .Include(a => a.Student)
                .ThenInclude(s => s.Profile)
            .Where(a => a.ProgramId == id && a.Status == ApplicationStatus.Approved)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Accepted Students");

        var headers = new[]
        {
            "Name", "Email", "Matric number", "Faculty", "Programme",
            "Phone", "Passport number", "Passport expiry", "Visa expiry", "Advisor Email", "Advisor Name"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
        }

        for (var rowIndex = 0; rowIndex < accepted.Count; rowIndex++)
        {
            var a = accepted[rowIndex];
            var p = a.Student.Profile;
            var rowNumber = rowIndex + 2;

            string? advisorName = null;
            if (p != null && !string.IsNullOrEmpty(p.AdvisorEmail))
            {
                var advisor = await _db.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == p.AdvisorEmail.ToLower() && u.Role == Domain.Enums.UserRole.AcademicAdvisor);
                advisorName = advisor?.FullName;
            }

            worksheet.Cell(rowNumber, 1).Value = a.Student.FullName;
            worksheet.Cell(rowNumber, 2).Value = a.Student.Email;
            worksheet.Cell(rowNumber, 3).Value = p?.MatricNumber;
            worksheet.Cell(rowNumber, 4).Value = p?.Faculty;
            worksheet.Cell(rowNumber, 5).Value = p?.Programme;
            worksheet.Cell(rowNumber, 6).Value = p?.PhoneNumber;
            worksheet.Cell(rowNumber, 7).Value = p?.PassportNumber;
            worksheet.Cell(rowNumber, 8).Value = p?.PassportExpiry?.ToString("yyyy-MM-dd");
            worksheet.Cell(rowNumber, 9).Value = p?.VisaExpiry?.ToString("yyyy-MM-dd");
            worksheet.Cell(rowNumber, 10).Value = p?.AdvisorEmail;
            worksheet.Cell(rowNumber, 11).Value = advisorName;
        }

        worksheet.Columns().AdjustToContents();

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        memoryStream.Position = 0;

        var fileName = System.IO.Path.GetFileNameWithoutExtension(program.Name)?.Replace(' ', '_') ?? "accepted-students";
        return File(memoryStream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{fileName}-accepted-students.xlsx");
    }
}
