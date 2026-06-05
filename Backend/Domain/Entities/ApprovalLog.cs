using Domain.Enums;

namespace Domain.Entities;

public class ApprovalLog
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid ActorId { get; set; }
    public ApplicationStatus FromStatus { get; set; }
    public ApplicationStatus ToStatus { get; set; }
    public string? Remark { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public MobilityApplication Application { get; set; } = null!;
    public User Actor { get; set; } = null!;
}