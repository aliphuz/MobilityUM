namespace Application.Interfaces;

public interface INotificationService
{
    Task SendAsync(string toEmail, string subject, string body);
}