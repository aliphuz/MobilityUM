using Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IConfiguration _config;

    public NotificationService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendAsync(string toEmail, string subject, string body)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_config["Mail:From"]!));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = body };

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(_config["Mail:Host"]!, int.Parse(_config["Mail:Port"]!), SecureSocketOptions.StartTls);
await smtp.AuthenticateAsync(_config["Mail:Username"]!, _config["Mail:Password"]!);
        await smtp.SendAsync(message);
        await smtp.DisconnectAsync(true);
    }
}