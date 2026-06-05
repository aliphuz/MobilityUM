namespace Application.DTOs;

public class StudentProfileDto
{
    public string? MatricNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Faculty { get; set; }
    public string? Programme { get; set; }
    public string? CurrentYear { get; set; }
    public string? PassportNumber { get; set; }
    public string? PassportNationality { get; set; }
    public DateTime? PassportExpiry { get; set; }
    public string? PassportBlobUrl { get; set; }
    public bool PassportUploaded { get; set; }
    public string? VisaType { get; set; }
    public DateTime? VisaExpiry { get; set; }
    public string? VisaBlobUrl { get; set; }
    public bool VisaUploaded { get; set; }
    public string? TranscriptBlobUrl { get; set; }
    public bool TranscriptUploaded { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string? AdvisorEmail { get; set; }
    public string? AdvisorName { get; set; }
    public string AdvisorStatus { get; set; } = "Pending";
    public TranscriptOcrResultDto? TranscriptOcrData { get; set; }
    public bool TranscriptOcrConfirmed { get; set; }
}

public class UpdateProfileDto
{
    public string? MatricNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Faculty { get; set; }
    public string? Programme { get; set; }
    public string? CurrentYear { get; set; }
    public string? AdvisorEmail { get; set; }
}

public class UpdatePassportDto
{
    public string? PassportNumber { get; set; }
    public string? PassportNationality { get; set; }
    public DateTime? PassportExpiry { get; set; }
}

public class UpdateVisaDto
{
    public string? VisaType { get; set; }
    public DateTime? VisaExpiry { get; set; }
}

public class AssignAdvisorDto
{
    public Guid AdvisorId { get; set; }
}

public class AddStudentByEmailDto
{
    public string Email { get; set; } = string.Empty;
}