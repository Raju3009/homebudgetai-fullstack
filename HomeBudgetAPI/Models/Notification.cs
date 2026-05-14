using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public class Notification
{
    public int Id { get; set; }
    [MaxLength(120)] public string Title { get; set; } = string.Empty;
    [MaxLength(500)] public string Message { get; set; } = string.Empty;
    [MaxLength(40)] public string Type { get; set; } = "Info";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public User? User { get; set; }
}
