using System.Collections.Generic;

namespace Application.DTOs;

public class TranscriptOcrResultDto
{
    public string? StudentName { get; set; }
    public string? MatricNumber { get; set; }
    public List<TranscriptSemesterDto> Semesters { get; set; } = new();
    public decimal? CGPA { get; set; }
}
