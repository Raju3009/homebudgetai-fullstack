using HomeBudgetAPI.Models;
using HomeBudgetAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace HomeBudgetAPI.Data;

public static class SeedData
{
    public static async Task ApplyAsync(AppDbContext db, IPasswordService passwords)
    {
        if (await db.Users.AnyAsync()) return;

        var user = new User
        {
            FullName = "Demo User",
            Email = "demo@homebudget.ai",
            Role = "Admin",
            PasswordHash = passwords.Hash("Demo@12345"),
            Setting = new UserSetting { Currency = "USD", Language = "en", Theme = "system" }
        };

        user.Transactions = new List<BudgetTransaction>
        {
            new() { Title = "Salary", Category = "Salary", Amount = 6200, Type = TransactionType.Income, Date = DateTime.UtcNow.AddDays(-20), Notes = "Monthly paycheck" },
            new() { Title = "Freelance project", Category = "Side Income", Amount = 900, Type = TransactionType.Income, Date = DateTime.UtcNow.AddDays(-8) },
            new() { Title = "Rent", Category = "Housing", Amount = 1800, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-18) },
            new() { Title = "Groceries", Category = "Food", Amount = 420, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-5) },
            new() { Title = "Internet", Category = "Utilities", Amount = 85, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-12) },
            new() { Title = "School savings", Category = "Savings", Amount = 650, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-3) },
            new() { Title = "Dining", Category = "Food", Amount = 180, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-2) },
            new() { Title = "Fitness", Category = "Healthcare", Amount = 95, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-1) }
        };

        user.Categories = new List<Category>
        {
            new() { Name = "Food", Color = "#10b981", Icon = "utensils" },
            new() { Name = "Housing", Color = "#4f46e5", Icon = "home" },
            new() { Name = "Utilities", Color = "#06b6d4", Icon = "zap" },
            new() { Name = "Savings", Color = "#7c3aed", Icon = "target" }
        };

        user.Budgets = new List<Budget>
        {
            new() { Name = "Essentials", Category = "Food", LimitAmount = 900, AlertThreshold = 80 },
            new() { Name = "Home base", Category = "Housing", LimitAmount = 2000, AlertThreshold = 90 },
            new() { Name = "Utilities guardrail", Category = "Utilities", LimitAmount = 250, AlertThreshold = 75 }
        };

        user.Goals = new List<FinancialGoal>
        {
            new() { Name = "Emergency fund", TargetAmount = 12000, CurrentAmount = 7400, DueDate = DateTime.UtcNow.AddMonths(8), Color = "#10b981" },
            new() { Name = "Vacation reserve", TargetAmount = 4500, CurrentAmount = 1900, DueDate = DateTime.UtcNow.AddMonths(5), Color = "#7c3aed" }
        };

        user.Notifications = new List<Notification>
        {
            new() { Title = "AI insight ready", Message = "Food spending increased 18% this month.", Type = "Insight" },
            new() { Title = "Budget alert", Message = "Housing is within the safe threshold.", Type = "Budget", IsRead = true },
            new() { Title = "Report available", Message = "Your monthly report is ready to export.", Type = "Report" }
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}
