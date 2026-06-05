using Domain.Enums;

namespace Application.DTOs;

public class MobilityProgramDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DestinationCountry { get; set; } = string.Empty;
    public string HostUniversity { get; set; } = string.Empty;
    public ProgramDurationType DurationType { get; set; }
    public int Quota { get; set; }
    public DateTime ApplicationDeadline { get; set; }
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
    
    public int TotalApplications { get; set; }
    public int TotalAccepted { get; set; }
    public int SlotsRemaining { get; set; }
}
