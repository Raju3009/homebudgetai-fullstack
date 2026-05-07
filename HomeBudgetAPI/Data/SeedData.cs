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
            PasswordHash = passwords.Hash("Demo@12345")
        };

        user.Transactions = new List<BudgetTransaction>
        {
            new() { Title = "Salary", Category = "Salary", Amount = 6200, Type = TransactionType.Income, Date = DateTime.UtcNow.AddDays(-20), Notes = "Monthly paycheck" },
            new() { Title = "Freelance project", Category = "Side Income", Amount = 900, Type = TransactionType.Income, Date = DateTime.UtcNow.AddDays(-8) },
            new() { Title = "Rent", Category = "Housing", Amount = 1800, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-18) },
            new() { Title = "Groceries", Category = "Food", Amount = 420, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-5) },
            new() { Title = "Internet", Category = "Utilities", Amount = 85, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-12) },
            new() { Title = "School savings", Category = "Savings", Amount = 650, Type = TransactionType.Expense, Date = DateTime.UtcNow.AddDays(-3) }
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}
