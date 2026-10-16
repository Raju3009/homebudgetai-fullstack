using System.Security.Claims;
using System.Text;
using System.Globalization;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Models;
using HomeBudgetAPI.Services;
using HomeBudgetAPI.Utilities;
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
    public async Task<ActionResult<ReportSummary>> Summary([FromQuery] string period = "monthly", [FromQuery] string? month = null, [FromQuery] int? year = null)
    {
        if (!IsValidPeriod(period, month, year))
            return BadRequest(new { message = "Use period=monthly with month=YYYY-MM, or period=yearly with a valid year." });

        return Ok(await BuildSummary(period, month, year));
    }

    private async Task<ReportSummary> BuildSummary(string period, string? month, int? year)
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
    public async Task<IActionResult> Export([FromQuery] string period = "monthly", [FromQuery] string? month = null, [FromQuery] int? year = null)
    {
        if (!IsValidPeriod(period, month, year))
            return BadRequest(new { message = "Use period=monthly with month=YYYY-MM, or period=yearly with a valid year." });

        var report = await BuildSummary(period, month, year);
        var csv = new StringBuilder("Metric,Value\n");
        csv.AppendLine($"Income,{report.Income.ToString(CultureInfo.InvariantCulture)}"); csv.AppendLine($"Expenses,{report.Expenses.ToString(CultureInfo.InvariantCulture)}"); csv.AppendLine($"Balance,{report.Balance.ToString(CultureInfo.InvariantCulture)}"); csv.AppendLine($"SavingsRate,{report.SavingsRate.ToString(CultureInfo.InvariantCulture)}");
        csv.AppendLine("\nCategory,Total");
        foreach (var item in report.Categories) csv.AppendLine($"{CsvField.Escape(item.Category)},{item.Total.ToString(CultureInfo.InvariantCulture)}");
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
        var selectedMonth = string.IsNullOrWhiteSpace(month)
            ? DateTime.UtcNow
            : DateTime.ParseExact($"{month}-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None);
        return query.Where(x => x.Date.Year == selectedMonth.Year && x.Date.Month == selectedMonth.Month);
    }

    private static bool IsValidPeriod(string period, string? month, int? year)
    {
        if (string.IsNullOrWhiteSpace(period))
            return false;

        if (period.Equals("yearly", StringComparison.OrdinalIgnoreCase))
            return year is null or (>= 1 and <= 9999);

        if (!period.Equals("monthly", StringComparison.OrdinalIgnoreCase) || year.HasValue)
            return false;

        return string.IsNullOrWhiteSpace(month)
            || DateTime.TryParseExact($"{month}-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
