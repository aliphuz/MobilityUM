namespace Application.DTOs;

public class ApplicationResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public string DestinationCountry { get; set; } = string.Empty;
    public string DurationType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ApprovalLogDto> ApprovalLogs { get; set; } = new();
    public PassportOcrResultDto? StudentPassportOcrData { get; set; }
    public TranscriptOcrResultDto? StudentTranscriptOcrData { get; set; }
}