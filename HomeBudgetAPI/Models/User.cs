using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public class User
{
    public int Id { get; set; }
    [MaxLength(120)] public string FullName { get; set; } = string.Empty;
    [MaxLength(180)] public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    [MaxLength(32)] public string Role { get; set; } = "User";
    [MaxLength(512)] public string? AvatarUrl { get; set; }
    public string? ResetTokenHash { get; set; }
    public DateTime? ResetTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public UserSetting? Setting { get; set; }
    public ICollection<BudgetTransaction> Transactions { get; set; } = new List<BudgetTransaction>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<FinancialGoal> Goals { get; set; } = new List<FinancialGoal>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
