namespace Domain.Entities;

public class ApplicationDocument
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public string DocumentType { get; set; } = string.Empty; // "Passport", "Visa", "FlightTicket", etc.
    public string BlobUrl { get; set; } = string.Empty;
    public string? OcrDataJson { get; set; } // raw JSON from Azure OCR stored as JSONB
    public bool IsOcrConfirmed { get; set; } = false;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public MobilityApplication Application { get; set; } = null!;
}