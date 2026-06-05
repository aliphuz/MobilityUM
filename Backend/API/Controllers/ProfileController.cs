using System;
using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize(Roles = "Student")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBlobService _blob;
    private readonly IOcrService _ocr;

    public ProfileController(AppDbContext db, IBlobService blob, IOcrService ocr)
    {
        _db = db;
        _blob = blob;
        _ocr = ocr;
    }

    private Guid CurrentUserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/profile
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var profile = await _db.StudentProfiles
            .FirstOrDefaultAsync(p => p.StudentId == CurrentUserId);

        if (profile == null)
            return Ok(new ExtendedStudentProfileDto());

        User? advisor = null;
        if (!string.IsNullOrEmpty(profile.AdvisorEmail))
        {
            advisor = await _db.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == profile.AdvisorEmail.Trim().ToLower() && u.Role == Domain.Enums.UserRole.AcademicAdvisor);
        }

        TranscriptOcrResultDto? transcriptOcrData = null;
        if (profile.TranscriptOcrJson != null)
        {
            try
            {
                transcriptOcrData = JsonSerializer.Deserialize<TranscriptOcrResultDto>(profile.TranscriptOcrJson);
            }
            catch { }
        }

        PassportOcrResultDto? passportOcrData = null;
        if (profile.PassportOcrJson != null)
        {
            try
            {
                passportOcrData = JsonSerializer.Deserialize<PassportOcrResultDto>(profile.PassportOcrJson);
            }
            catch { }
        }

        var passportSas = await _blob.GetPresignedUrlAsync(profile.PassportBlobUrl, 60);
        var visaSas = await _blob.GetPresignedUrlAsync(profile.VisaBlobUrl, 60);
        var transcriptSas = await _blob.GetPresignedUrlAsync(profile.TranscriptBlobUrl, 60);
        var photoSas = await _blob.GetPresignedUrlAsync(profile.ProfilePhotoUrl, 60);

        return Ok(new ExtendedStudentProfileDto
        {
            MatricNumber = profile.MatricNumber,
            PhoneNumber = profile.PhoneNumber,
            Faculty = profile.Faculty,
            Programme = profile.Programme,
            CurrentYear = profile.CurrentYear,
            PassportNumber = profile.PassportNumber,
            PassportNationality = profile.PassportNationality,
            PassportExpiry = profile.PassportExpiry,
            PassportBlobUrl = passportSas,
            PassportUploaded = profile.PassportUploaded,
            VisaType = profile.VisaType,
            VisaExpiry = profile.VisaExpiry,
            VisaBlobUrl = visaSas,
            VisaUploaded = profile.VisaUploaded,
            TranscriptBlobUrl = transcriptSas,
            TranscriptUploaded = profile.TranscriptUploaded,
            ProfilePhotoUrl = photoSas,
            AdvisorEmail = profile.AdvisorEmail,
            AdvisorName = advisor?.FullName,
            AdvisorStatus = profile.AdvisorStatus.ToString(),
            TranscriptOcrData = transcriptOcrData,
            TranscriptOcrConfirmed = profile.TranscriptOcrConfirmed,
            PassportOcrConfirmed = profile.PassportOcrConfirmed,
            PassportOcrData = passportOcrData
        });
    }

    // PUT /api/profile — update basic info
    [HttpPut]
    public async Task<IActionResult> Update(UpdateProfileDto dto)
    {
        var profile = await _db.StudentProfiles
            .FirstOrDefaultAsync(p => p.StudentId == CurrentUserId);

        if (profile == null)
        {
            profile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                StudentId = CurrentUserId
            };
            _db.StudentProfiles.Add(profile);
        }

        var advisorChanged = profile.AdvisorEmail != dto.AdvisorEmail;

        profile.MatricNumber = dto.MatricNumber;
        profile.PhoneNumber = dto.PhoneNumber;
        profile.Faculty = dto.Faculty;
        profile.Programme = dto.Programme;
        profile.CurrentYear = dto.CurrentYear;
        profile.AdvisorEmail = dto.AdvisorEmail;

        if (advisorChanged)
            profile.AdvisorStatus = Domain.Enums.AdvisorStatus.Pending;

        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Profile updated." });
    }

    // POST /api/profile/photo — upload profile picture
    [HttpPost("photo")]
    [HttpPost("picture")]
    public async Task<IActionResult> UploadProfilePhoto(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        var profile = await GetOrCreateProfile();

        using var stream = file.OpenReadStream();
        var blobUrl = await _blob.UploadAsync(stream, file.FileName, file.ContentType);

        profile.ProfilePhotoUrl = blobUrl;
        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        var sasUrl = await _blob.GetPresignedUrlAsync(blobUrl, 60);

        return Ok(new { blobUrl = sasUrl, message = "Profile photo uploaded." });
    }

    // POST /api/profile/passport — upload + OCR passport
    [HttpPost("passport")]
    public async Task<IActionResult> UploadPassport(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is empty.");

        var profile = await GetOrCreateProfile();

        using var stream = file.OpenReadStream();
        var blobUrl = await _blob.UploadAsync(stream, file.FileName, file.ContentType);

        profile.PassportBlobUrl = blobUrl;
        profile.PassportUploaded = true;

        OcrResult? ocrResult = null;
        try
        {
            using var ocrStream = file.OpenReadStream();
            ocrResult = await _ocr.ExtractPassportDataAsync(
                ocrStream, file.ContentType);

            if (!string.IsNullOrWhiteSpace(ocrResult.DocumentNumber))
                profile.PassportNumber = ocrResult.DocumentNumber.Trim();

            if (!string.IsNullOrWhiteSpace(ocrResult.Nationality))
                profile.PassportNationality = ocrResult.Nationality.Trim();

            if (TryParseOcrDate(ocrResult.ExpiryDate, out var expiry))
                profile.PassportExpiry = expiry;
        }
        catch
        {
            // OCR failure should not prevent upload
        }

        profile.PassportOcrJson = ocrResult?.RawJson;
        profile.PassportOcrConfirmed = false;
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        var sasUrl = await _blob.GetPresignedUrlAsync(blobUrl, 60);

        return Ok(new
        {
            passportBlobUrl = sasUrl,
            message = "Passport uploaded.",
            ocrData = ocrResult == null ? null : new
            {
                firstName = ocrResult.FirstName,
                lastName = ocrResult.LastName,
                documentNumber = ocrResult.DocumentNumber,
                dateOfBirth = ocrResult.DateOfBirth,
                expiryDate = ocrResult.ExpiryDate,
                countryRegion = ocrResult.Nationality,
                sex = ocrResult.Sex
            }
        });
    }

    private static bool TryParseOcrDate(string? dateString, out DateTime date)
    {
        date = default;
        if (string.IsNullOrWhiteSpace(dateString)) return false;

        var formats = new[]
        {
            "yyyy-MM-dd", "yyyy/MM/dd", "MM/dd/yyyy", "dd/MM/yyyy",
            "MM-dd-yyyy", "dd-MM-yyyy", "ddMMyyyy"
        };

        if (DateTime.TryParseExact(dateString, formats, CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out date))
        {
            return true;
        }

        return DateTime.TryParse(dateString, CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out date);
    }

    // PUT /api/profile/passport — save confirmed passport details
    [HttpPut("passport")]
    public async Task<IActionResult> UpdatePassport(UpdatePassportDto dto)
    {
        var profile = await GetOrCreateProfile();

        profile.PassportNumber = dto.PassportNumber;
        profile.PassportNationality = dto.PassportNationality;
        profile.PassportExpiry = dto.PassportExpiry?.ToUniversalTime(); 
        profile.PassportOcrConfirmed = true;
        
        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Passport details saved." });
    }

    // POST /api/profile/visa — upload visa document
    [HttpPost("visa")]
    public async Task<IActionResult> UploadVisa(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is empty.");

        var profile = await GetOrCreateProfile();

        using var stream = file.OpenReadStream();
        var blobUrl = await _blob.UploadAsync(stream, file.FileName, file.ContentType);

        profile.VisaBlobUrl = blobUrl;
        profile.VisaUploaded = true;
        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        var sasUrl = await _blob.GetPresignedUrlAsync(blobUrl, 60);

        return Ok(new { blobUrl = sasUrl, message = "Visa uploaded." });
    }

    // PUT /api/profile/visa — save visa details
    [HttpPut("visa")]
    public async Task<IActionResult> UpdateVisa(UpdateVisaDto dto)
    {
        var profile = await GetOrCreateProfile();

        profile.VisaType = dto.VisaType;
        profile.VisaExpiry = dto.VisaExpiry?.ToUniversalTime(); 
        
        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Visa details saved." });
    }

    // POST /api/profile/transcript — upload transcript
    [HttpPost("transcript")]
    public async Task<IActionResult> UploadTranscript(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is empty.");

        var profile = await GetOrCreateProfile();

        using var stream = file.OpenReadStream();
        var blobUrl = await _blob.UploadAsync(stream, file.FileName, file.ContentType);

        profile.TranscriptBlobUrl = blobUrl;
        profile.TranscriptUploaded = true;

        TranscriptOcrResultDto? parsedDto = null;
        string? rawJson = null;
        try
        {
            using var ocrStream = file.OpenReadStream();
            var ocrRes = await _ocr.AnalyzeTranscriptAsync(ocrStream);
            parsedDto = ocrRes.parsed;
            rawJson = ocrRes.rawJson;
            profile.TranscriptOcrJson = rawJson;
            profile.TranscriptOcrConfirmed = false;
        }
        catch
        {
            // Ignore OCR failure
        }

        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var sasUrl = await _blob.GetPresignedUrlAsync(blobUrl, 60);

        return Ok(new { transcriptBlobUrl = sasUrl, ocrData = parsedDto, message = "Transcript uploaded." });
    }

    // PUT /api/profile/transcript — confirm transcript OCR details
    [HttpPut("transcript")]
    public async Task<IActionResult> ConfirmTranscript(ConfirmTranscriptDto dto)
    {
        var profile = await GetOrCreateProfile();
        profile.TranscriptOcrJson = JsonSerializer.Serialize(dto);
        profile.TranscriptOcrConfirmed = true;
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Transcript OCR details confirmed." });
    }

    // PUT /api/profile/{studentId}/advisor — assign an academic advisor to a student
    [HttpPut("{studentId}/advisor")]
    [Authorize(Roles = "TdhepAdmin")]
    public async Task<IActionResult> AssignAdvisor(Guid studentId, AssignAdvisorDto dto)
    {
        var profile = await _db.StudentProfiles
            .FirstOrDefaultAsync(p => p.StudentId == studentId);

        if (profile == null)
            return NotFound("Student profile not found.");

        var advisor = await _db.Users.FindAsync(dto.AdvisorId);
        if (advisor == null || advisor.Role != Domain.Enums.UserRole.AcademicAdvisor)
            return BadRequest("Advisor not found or invalid role.");

        profile.AdvisorEmail = advisor.Email;
        profile.AdvisorStatus = Domain.Enums.AdvisorStatus.Accepted;
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Advisor assigned to student." });
    }

    private async Task<StudentProfile> GetOrCreateProfile()
    {
        var profile = await _db.StudentProfiles
            .FirstOrDefaultAsync(p => p.StudentId == CurrentUserId);

        if (profile != null) return profile;

        profile = new StudentProfile
        {
            Id = Guid.NewGuid(),
            StudentId = CurrentUserId
        };
        _db.StudentProfiles.Add(profile);
        return profile;
    }
}

public class ConfirmTranscriptDto
{
    public string? StudentName { get; set; }
    public string? MatricNumber { get; set; }
    public decimal? CGPA { get; set; }
    public List<TranscriptSemesterDto> Semesters { get; set; } = new();
}

public class ExtendedStudentProfileDto : StudentProfileDto
{
    public bool PassportOcrConfirmed { get; set; }
    public PassportOcrResultDto? PassportOcrData { get; set; }
}