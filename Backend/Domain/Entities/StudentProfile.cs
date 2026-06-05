using Domain.Enums;

namespace Domain.Entities;

public class StudentProfile
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string? MatricNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Faculty { get; set; }
    public string? Programme { get; set; }
    public string? CurrentYear { get; set; }

    // Passport fields
    public string? PassportNumber { get; set; }
    public string? PassportNationality { get; set; }
    public DateTime? PassportExpiry { get; set; }
    public string? PassportBlobUrl { get; set; }
    public bool PassportUploaded { get; set; } = false;

    // Visa fields
    public string? VisaType { get; set; }
    public DateTime? VisaExpiry { get; set; }
    public string? VisaBlobUrl { get; set; }
    public bool VisaUploaded { get; set; } = false;

    // Academic transcript
    public string? TranscriptBlobUrl { get; set; }
    public bool TranscriptUploaded { get; set; } = false;

    // Student profile photo
    public string? ProfilePhotoUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string? AdvisorEmail { get; set; }
    public AdvisorStatus AdvisorStatus { get; set; } = AdvisorStatus.Pending;

    public string? PassportOcrJson { get; set; }
    public bool PassportOcrConfirmed { get; set; } = false;

    public string? TranscriptOcrJson { get; set; }
    public bool TranscriptOcrConfirmed { get; set; } = false;

    public User Student { get; set; } = null!;
}