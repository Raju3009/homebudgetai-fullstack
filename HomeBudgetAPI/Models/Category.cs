using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public class Category
{
    public int Id { get; set; }
    [MaxLength(80)] public string Name { get; set; } = string.Empty;
    [MaxLength(24)] public string Color { get; set; } = "#4f46e5";
    [MaxLength(32)] public string Icon { get; set; } = "wallet";
    public int UserId { get; set; }
    public User? User { get; set; }
}
