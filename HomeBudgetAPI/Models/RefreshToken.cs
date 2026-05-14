using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public class RefreshToken
{
    public int Id { get; set; }
    [MaxLength(256)] public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }
    public bool IsActive => RevokedAt is null && ExpiresAt > DateTime.UtcNow;
    public int UserId { get; set; }
    public User? User { get; set; }
}
