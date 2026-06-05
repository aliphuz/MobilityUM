using Application.Interfaces;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using Azure.Storage.Sas;

namespace Infrastructure.Services;

public class BlobService : IBlobService
{
    private readonly BlobContainerClient _container;
    private readonly string _connectionString;

    public BlobService(IConfiguration config)
    {
        var connStr = config["Azure:BlobStorage:ConnectionString"]!;
        _connectionString = connStr;
        var containerName = config["Azure:BlobStorage:ContainerName"]!;
        _container = new BlobContainerClient(connStr, containerName);
        _container.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task<string> UploadAsync(
        Stream fileStream, string fileName, string contentType)
    {
        var uniqueName = $"{Guid.NewGuid()}_{fileName}";
        var blob = _container.GetBlobClient(uniqueName);

        await blob.UploadAsync(fileStream, new BlobHttpHeaders
        {
            ContentType = contentType
        });

        return blob.Uri.ToString();
    }

    public async Task DeleteAsync(string fileName)
    {
        var blob = _container.GetBlobClient(fileName);
        await blob.DeleteIfExistsAsync();
    }

    public Task<string?> GetPresignedUrlAsync(string? blobUrl, int expiryMinutes)
    {
        if (string.IsNullOrEmpty(blobUrl)) return Task.FromResult<string?>(null);

        try
        {
            var uri = new Uri(blobUrl);
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length < 2) return Task.FromResult<string?>(blobUrl);

            var containerName = Uri.UnescapeDataString(segments[0]);
            var blobName = Uri.UnescapeDataString(string.Join("/", segments.Skip(1)));

            var blobClient = new BlobClient(_connectionString, containerName, blobName);

            BlobSasBuilder sas = new BlobSasBuilder
            {
                BlobContainerName = containerName,
                BlobName = blobName,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
            };
            sas.SetPermissions(BlobSasPermissions.Read);

            var sasUri = blobClient.GenerateSasUri(sas);
            return Task.FromResult<string?>(sasUri.ToString());
        }
        catch
        {
            return Task.FromResult<string?>(blobUrl);
        }
    }
}