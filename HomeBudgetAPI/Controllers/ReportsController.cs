using System.Security.Claims;
using System.Text;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Models;
using HomeBudgetAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudgetAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IInsightService _insights;
    public ReportsController(AppDbContext db, IInsightService insights) { _db = db; _insights = insights; }

    [HttpGet("summary")]
    public async Task<ReportSummary> Summary([FromQuery] string period = "monthly", [FromQuery] string? month = null, [FromQuery] int? year = null)
    {
        var query = Scoped(period, month, year);
        var data = await query.OrderByDescending(x => x.Date).ToListAsync();
        var income = data.Where(x => x.Type == TransactionType.Income).Sum(x => x.Amount);
        var expenses = data.Where(x => x.Type == TransactionType.Expense).Sum(x => x.Amount);
        var categories = data.Where(x => x.Type == TransactionType.Expense).GroupBy(x => x.Category).Select(x => new CategoryTotal(x.Key, x.Sum(v => v.Amount))).OrderByDescending(x => x.Total).ToList();
        var months = data.GroupBy(x => new DateTime(x.Date.Year, x.Date.Month, 1)).OrderBy(x => x.Key).Select(x => new MonthlyTotal(x.Key.ToString("MMM yyyy"), x.Where(v => v.Type == TransactionType.Income).Sum(v => v.Amount), x.Where(v => v.Type == TransactionType.Expense).Sum(v => v.Amount))).ToList();
        var savingsRate = income <= 0 ? 0 : Math.Round(((income - expenses) / income) * 100, 1);
        var suggestions = _insights.CreateSuggestions(income, expenses, categories.ToDictionary(x => x.Category, x => x.Total));
        return new ReportSummary(income, expenses, income - expenses, savingsRate, categories, months, suggestions, DateTime.UtcNow);
    }

    [HttpGet("export")]
    public async Task<FileContentResult> Export([FromQuery] string period = "monthly", [FromQuery] string? month = null, [FromQuery] int? year = null)
    {
        var report = await Summary(period, month, year);
        var csv = new StringBuilder("Metric,Value\n");
        csv.AppendLine($"Income,{report.Income}"); csv.AppendLine($"Expenses,{report.Expenses}"); csv.AppendLine($"Balance,{report.Balance}"); csv.AppendLine($"SavingsRate,{report.SavingsRate}");
        csv.AppendLine("\nCategory,Total");
        foreach (var item in report.Categories) csv.AppendLine($"{Escape(item.Category)},{item.Total}");
        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "homebudget-report.csv");
    }

    private IQueryable<BudgetTransaction> Scoped(string period, string? month, int? year)
    {
        var query = _db.Transactions.Where(x => x.UserId == UserId);
        if (period.Equals("yearly", StringComparison.OrdinalIgnoreCase))
        {
            var selectedYear = year ?? DateTime.UtcNow.Year;
            return query.Where(x => x.Date.Year == selectedYear);
        }
        var selectedMonth = DateTime.TryParse($"{month}-01", out var parsed) ? parsed : DateTime.UtcNow;
        return query.Where(x => x.Date.Year == selectedMonth.Year && x.Date.Month == selectedMonth.Month);
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static string Escape(string value) => $"\"{value.Replace("\"", "\"\"")}\"";
}
