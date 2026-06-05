using System.Text.Json.Serialization;

namespace Application.DTOs;

public class ReviewApplicationDto
{
    [JsonPropertyName("approved")]
    public bool Approved { get; set; }
    public string? Remark { get; set; }
}