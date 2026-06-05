using System;

namespace Application.DTOs;

public class ApprovalLogDto
{
    public Guid Id { get; set; }
    public string ActorName { get; set; } = "";
    public string ActorRole { get; set; } = "";
    public string FromStatus { get; set; } = "";
    public string ToStatus { get; set; } = "";
    public string? Remark { get; set; }
    public DateTime Timestamp { get; set; }
}
