using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public class UserSetting
{
    public int Id { get; set; }
    [MaxLength(8)] public string Currency { get; set; } = "USD";
    [MaxLength(12)] public string Language { get; set; } = "en";
    [MaxLength(12)] public string Theme { get; set; } = "system";
    public bool EmailNotifications { get; set; } = true;
    public bool PushNotifications { get; set; } = true;
    public bool MonthlyDigest { get; set; } = true;
    public int UserId { get; set; }
    public User? User { get; set; }
}
