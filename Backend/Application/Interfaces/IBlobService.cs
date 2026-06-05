namespace Application.Interfaces;

public interface IBlobService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType);
    Task DeleteAsync(string fileName);
    Task<string?> GetPresignedUrlAsync(string? blobUrl, int expiryMinutes);
}