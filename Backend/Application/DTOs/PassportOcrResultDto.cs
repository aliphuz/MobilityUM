namespace Application.DTOs;

public class PassportOcrResultDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DocumentNumber { get; set; }
    public string? DateOfBirth { get; set; }
    public string? ExpiryDate { get; set; }
    public string? Nationality { get; set; }
    public string? Sex { get; set; }
}
