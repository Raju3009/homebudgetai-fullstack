using System.Security.Claims;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Models;
using HomeBudgetAPI.Repositories;
using HomeBudgetAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeBudgetAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ITransactionRepository _transactions;
    private readonly IInsightService _insights;

    public DashboardController(ITransactionRepository transactions, IInsightService insights)
    {
        _transactions = transactions;
        _insights = insights;
    }

    [HttpGet]
    public async Task<DashboardSummary> Get()
    {
        var data = await _transactions.ListForDashboardAsync(int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!));
        var income = data.Where(x => x.Type == TransactionType.Income).Sum(x => x.Amount);
        var expenses = data.Where(x => x.Type == TransactionType.Expense).Sum(x => x.Amount);
        var categories = data.Where(x => x.Type == TransactionType.Expense)
            .GroupBy(x => x.Category)
            .Select(x => new CategoryTotal(x.Key, x.Sum(v => v.Amount)))
            .OrderByDescending(x => x.Total)
            .ToList();
        var monthly = data.GroupBy(x => new DateTime(x.Date.Year, x.Date.Month, 1))
            .OrderBy(x => x.Key)
            .Select(x => new MonthlyTotal(x.Key.ToString("MMM yyyy"), x.Where(v => v.Type == TransactionType.Income).Sum(v => v.Amount), x.Where(v => v.Type == TransactionType.Expense).Sum(v => v.Amount)))
            .ToList();
        var recent = data.Take(6).Select(x => new TransactionResponse(x.Id, x.Title, x.Category, x.Amount, x.Type, x.Date, x.Notes)).ToList();
        var savingsRate = income <= 0 ? 0 : Math.Round(((income - expenses) / income) * 100, 1);
        return new DashboardSummary(income, expenses, income - expenses, savingsRate, categories, monthly, recent, _insights.CreateSuggestions(income, expenses, categories.ToDictionary(x => x.Category, x => x.Total)));
    }
}
