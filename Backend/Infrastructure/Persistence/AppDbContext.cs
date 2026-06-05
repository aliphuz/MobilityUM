using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<MobilityProgram> MobilityPrograms => Set<MobilityProgram>();
    public DbSet<MobilityApplication> MobilityApplications => Set<MobilityApplication>();
    public DbSet<ApplicationDocument> ApplicationDocuments => Set<ApplicationDocument>();
    public DbSet<ApprovalLog> ApprovalLogs => Set<ApprovalLog>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Store OcrDataJson as PostgreSQL JSONB
        modelBuilder.Entity<ApplicationDocument>()
            .Property(d => d.OcrDataJson)
            .HasColumnType("jsonb");

        // Store enums as strings (readable in DB)
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        modelBuilder.Entity<MobilityApplication>()
            .Property(a => a.Status)
            .HasConversion<string>();

        modelBuilder.Entity<MobilityProgram>()
            .Property(p => p.DurationType)
            .HasConversion<string>();

        modelBuilder.Entity<ApprovalLog>()
            .Property(l => l.FromStatus).HasConversion<string>();
        modelBuilder.Entity<ApprovalLog>()
            .Property(l => l.ToStatus).HasConversion<string>();

        modelBuilder.Entity<StudentProfile>()
            .Property(sp => sp.AdvisorStatus)
            .HasConversion<string>();

        modelBuilder.Entity<StudentProfile>()
            .Property(sp => sp.PassportOcrJson)
            .HasColumnType("jsonb");

        modelBuilder.Entity<StudentProfile>()
            .Property(sp => sp.TranscriptOcrJson)
            .HasColumnType("jsonb");

        modelBuilder.Entity<StudentProfile>()
            .HasOne(sp => sp.Student)
            .WithOne(u => u.Profile)
            .HasForeignKey<StudentProfile>(sp => sp.StudentId);
    }
}