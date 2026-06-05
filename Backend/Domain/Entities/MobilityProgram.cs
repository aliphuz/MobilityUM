using Domain.Enums;

namespace Domain.Entities;

public class MobilityProgram
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DestinationCountry { get; set; } = string.Empty;
    public string HostUniversity { get; set; } = string.Empty;
    public ProgramDurationType DurationType { get; set; }
    public int Quota { get; set; }
    public DateTime ApplicationDeadline { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ImageUrl { get; set; }

    public ICollection<MobilityApplication> Applications { get; set; } = new List<MobilityApplication>();
}