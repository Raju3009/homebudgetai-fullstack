using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public class FinancialGoal
{
    public int Id { get; set; }
    [MaxLength(120)] public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddMonths(6);
    [MaxLength(24)] public string Color { get; set; } = "#10b981";
    public int UserId { get; set; }
    public User? User { get; set; }
}
