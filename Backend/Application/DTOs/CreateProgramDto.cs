namespace Application.DTOs;

public class CreateProgramDto
{
    public string Name { get; set; } = string.Empty;
    public string DestinationCountry { get; set; } = string.Empty;
    public string HostUniversity { get; set; } = string.Empty;
    public string DurationType { get; set; } = string.Empty; // "ShortTerm" or "LongTerm"
    public int Quota { get; set; }
    public DateTime ApplicationDeadline { get; set; }
}