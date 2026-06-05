namespace Application.Interfaces;

using Application.DTOs;

public class OcrResult
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DocumentNumber { get; set; }
    public string? DateOfBirth { get; set; }
    public string? ExpiryDate { get; set; }
    public string? Nationality { get; set; }
    public string? Sex { get; set; }
    public string RawJson { get; set; } = string.Empty;
}

public interface IOcrService
{
    Task<OcrResult> ExtractPassportDataAsync(Stream fileStream, string contentType);
    Task<(TranscriptOcrResultDto parsed, string rawJson)> AnalyzeTranscriptAsync(Stream stream);
}