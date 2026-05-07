using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public enum TransactionType
{
    Income = 1,
    Expense = 2
}

public class BudgetTransaction
{
    public int Id { get; set; }

    [MaxLength(160)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Category { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public TransactionType Type { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }
}
