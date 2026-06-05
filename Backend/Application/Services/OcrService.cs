using Application.DTOs;
using Application.Interfaces;
using Azure;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Infrastructure.Services;

public class OcrService : IOcrService
{
    private readonly DocumentAnalysisClient _client;

    public OcrService(IConfiguration config)
    {
        var endpoint = config["Azure:FormRecognizer:Endpoint"]!;
        var key = config["Azure:FormRecognizer:Key"]!;
        _client = new DocumentAnalysisClient(
            new Uri(endpoint),
            new AzureKeyCredential(key));
    }

    public async Task<OcrResult> ExtractPassportDataAsync(
        Stream fileStream, string contentType)
    {
        var operation = await _client.AnalyzeDocumentAsync(
            WaitUntil.Completed,
            "prebuilt-idDocument",
            fileStream);

        var result = operation.Value;
        var doc = result.Documents.FirstOrDefault();

        if (doc == null)
            return new OcrResult { RawJson = "{}" };

        string? GetField(string name) =>
            doc.Fields.TryGetValue(name, out var f)
                ? f.Content : null;

        var ocrResult = new OcrResult
        {
            FirstName     = GetField("FirstName"),
            LastName      = GetField("LastName"),
            DocumentNumber= GetField("DocumentNumber"),
            DateOfBirth   = GetField("DateOfBirth"),
            ExpiryDate    = GetField("ExpiryDate"),
            Nationality   = GetField("CountryRegion"),
            Sex           = GetField("Sex"),
        };

        ocrResult.RawJson = JsonSerializer.Serialize(ocrResult);
        return ocrResult;
    }

    public async Task<(TranscriptOcrResultDto parsed, string rawJson)> AnalyzeTranscriptAsync(Stream stream)
    {
        var operation = await _client.AnalyzeDocumentAsync(
            WaitUntil.Completed,
            "prebuilt-layout",
            stream);

        var result = operation.Value;

        var allLines = result.Pages
            .SelectMany(p => p.Lines)
            .Select(l => l.Content)
            .ToList();

        string? studentName = null;
        string? matricNumber = null;
        decimal? cgpa = null;

        var semesters = new List<TranscriptSemesterDto>();
        string? currentYear = null;
        string? currentSemester = null;

        for (int i = 0; i < allLines.Count; i++)
        {
            var line = allLines[i].Trim();

            // 1. StudentName: line that follows a line containing "Name:" (case-insensitive)
            if (line.Contains("Name:", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 < allLines.Count)
                {
                    if (string.IsNullOrEmpty(studentName))
                    {
                        var nextLine = allLines[i + 1].Trim();
                        // Ignore some helper labels if they appear
                        if (!nextLine.Contains("Matric", StringComparison.OrdinalIgnoreCase) && 
                            !nextLine.Contains("Faculty", StringComparison.OrdinalIgnoreCase))
                        {
                            studentName = nextLine;
                        }
                    }
                }
            }

            // 2. MatricNumber: line matching regex pattern [A-Z]{1,2}\d{7,10} (UM matric format)
            var matricMatch = Regex.Match(line, @"[A-Z]{1,2}\d{7,10}");
            if (matricMatch.Success && string.IsNullOrEmpty(matricNumber))
            {
                matricNumber = matricMatch.Value;
            }

            // 3. Year: 4-digit number e.g. "2022", "2023"
            var yearMatch = Regex.Match(line, @"\b(20\d{2})\b");
            if (yearMatch.Success)
            {
                currentYear = yearMatch.Value;
            }

            // 4. Semester: line containing "Semester 1", "Semester 2", "Sem 1", "Sem 2" (case-insensitive)
            if (line.Contains("Semester 1", StringComparison.OrdinalIgnoreCase) || line.Contains("Sem 1", StringComparison.OrdinalIgnoreCase))
            {
                currentSemester = "Semester 1";
            }
            else if (line.Contains("Semester 2", StringComparison.OrdinalIgnoreCase) || line.Contains("Sem 2", StringComparison.OrdinalIgnoreCase))
            {
                currentSemester = "Semester 2";
            }

            // 5. GPA: decimal value on line containing "GPA" but NOT "CGPA"
            if (line.Contains("GPA", StringComparison.OrdinalIgnoreCase) && !line.Contains("CGPA", StringComparison.OrdinalIgnoreCase))
            {
                var gpaMatch = Regex.Match(line, @"\d+\.\d+");
                if (gpaMatch.Success && decimal.TryParse(gpaMatch.Value, out var gpaVal))
                {
                    semesters.Add(new TranscriptSemesterDto
                    {
                        Year = currentYear ?? "Unknown Year",
                        Semester = currentSemester ?? "Unknown Semester",
                        GPA = gpaVal
                    });
                    currentSemester = null; // Reset for next semester detection
                }
            }

            // 6. CGPA: decimal value on line containing "CGPA" or "Cumulative"
            if (line.Contains("CGPA", StringComparison.OrdinalIgnoreCase) || line.Contains("Cumulative", StringComparison.OrdinalIgnoreCase))
            {
                var cgpaMatch = Regex.Match(line, @"\d+\.\d+");
                if (cgpaMatch.Success && decimal.TryParse(cgpaMatch.Value, out var cgpaVal))
                {
                    cgpa = cgpaVal;
                }
            }
        }

        var parsedDto = new TranscriptOcrResultDto
        {
            StudentName = studentName,
            MatricNumber = matricNumber,
            Semesters = semesters,
            CGPA = cgpa
        };

        var rawJson = JsonSerializer.Serialize(parsedDto);
        return (parsedDto, rawJson);
    }
}