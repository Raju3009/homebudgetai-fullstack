using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public class Budget
{
    public int Id { get; set; }
    [MaxLength(120)] public string Name { get; set; } = string.Empty;
    [MaxLength(80)] public string Category { get; set; } = string.Empty;
    public decimal LimitAmount { get; set; }
    public DateTime Month { get; set; } = new(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
    public int AlertThreshold { get; set; } = 80;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public User? User { get; set; }
}
