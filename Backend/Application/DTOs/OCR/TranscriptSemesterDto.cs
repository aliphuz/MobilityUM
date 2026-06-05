namespace Application.DTOs;

public class TranscriptSemesterDto
{
    public string Year { get; set; } = "";
    public string Semester { get; set; } = "";
    public decimal? GPA { get; set; }
}
