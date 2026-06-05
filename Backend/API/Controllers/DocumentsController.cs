using System;
using System.Collections.Generic;
using System.IO;
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

public class ConfirmOcrDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DocumentNumber { get; set; }
    public string? DateOfBirth { get; set; }
    public string? ExpiryDate { get; set; }
    public string? Nationality { get; set; }
}

[ApiController]
[Route("api/applications/{applicationId}/documents")]
[Authorize(Roles = "Student")]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IOcrService _ocr;
    private readonly IBlobService _blob;

    public DocumentsController(
        AppDbContext db,
        IOcrService ocr,
        IBlobService blob)
    {
        _db = db;
        _ocr = ocr;
        _blob = blob;
    }

    private Guid CurrentUserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // POST /api/applications/{id}/documents/upload
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(
        Guid applicationId,
        IFormFile file,
        [FromQuery] string documentType = "Passport")
    {
        var application = await _db.MobilityApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId
                                   && a.StudentId == CurrentUserId);

        if (application == null)
            return NotFound("Application not found.");

        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        // Upload to Azure Blob
        using var stream = file.OpenReadStream();
        var blobUrl = await _blob.UploadAsync(
            stream, file.FileName, file.ContentType);

        // Run OCR if it's a passport
        OcrResult? ocrResult = null;
        if (documentType == "Passport")
        {
            stream.Position = 0;
            using var ocrStream = file.OpenReadStream();
            ocrResult = await _ocr.ExtractPassportDataAsync(
                ocrStream, file.ContentType);
        }

        // Save document record (unconfirmed)
        var document = new ApplicationDocument
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            DocumentType = documentType,
            BlobUrl = blobUrl,
            OcrDataJson = ocrResult?.RawJson,
            IsOcrConfirmed = false
        };

        _db.ApplicationDocuments.Add(document);
        await _db.SaveChangesAsync();

        var sasUrl = await _blob.GetPresignedUrlAsync(blobUrl, 60);

        return Ok(new
        {
            documentId = document.Id,
            blobUrl = sasUrl,
            ocrExtracted = ocrResult,
            message = "Please review and confirm the extracted data."
        });
    }

    // POST /api/applications/{id}/documents/{documentId}/confirm
    [HttpPost("{documentId}/confirm")]
    public async Task<IActionResult> ConfirmOcr(
        Guid applicationId,
        Guid documentId,
        ConfirmOcrDto dto)
    {
        var document = await _db.ApplicationDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId
                                   && d.ApplicationId == applicationId);

        if (document == null) return NotFound("Document not found.");
        if (document.IsOcrConfirmed)
            return BadRequest("Document already confirmed.");

        document.OcrDataJson = JsonSerializer.Serialize(dto);
        document.IsOcrConfirmed = true;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Document confirmed successfully." });
    }

    // GET /api/applications/{id}/documents
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid applicationId)
    {
        var documents = await _db.ApplicationDocuments
            .Where(d => d.ApplicationId == applicationId)
            .ToListAsync();

        var result = new List<object>();
        foreach (var d in documents)
        {
            var sasUrl = await _blob.GetPresignedUrlAsync(d.BlobUrl, 60);
            result.Add(new
            {
                d.Id,
                d.DocumentType,
                BlobUrl = sasUrl,
                d.IsOcrConfirmed,
                d.UploadedAt,
                OcrData = d.OcrDataJson != null
                    ? JsonSerializer.Deserialize<object>(d.OcrDataJson, (JsonSerializerOptions?)null)
                    : null
            });
        }

        return Ok(result);
    }
}