using Domain.Enums;

namespace Domain.Entities;

public class MobilityApplication
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid ProgramId { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
    public string? RejectionRemark { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Student { get; set; } = null!;
    public MobilityProgram Program { get; set; } = null!;
    public ICollection<ApplicationDocument> Documents { get; set; } = new List<ApplicationDocument>();
    public ICollection<ApprovalLog> ApprovalLogs { get; set; } = new List<ApprovalLog>();
}