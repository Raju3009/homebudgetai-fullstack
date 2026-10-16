using System.Security.Claims;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudgetAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BudgetsController : ControllerBase
{
    private readonly AppDbContext _db;
    public BudgetsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IReadOnlyList<BudgetResponse>> List()
    {
        var userId = UserId;
        var budgets = await _db.Budgets.Where(x => x.UserId == userId).OrderByDescending(x => x.Month).ThenBy(x => x.Category).ToListAsync();
        if (budgets.Count == 0) return Array.Empty<BudgetResponse>();

        var firstMonth = budgets.Min(x => new DateTime(x.Month.Year, x.Month.Month, 1, 0, 0, 0, DateTimeKind.Utc));
        var afterLastMonth = budgets.Max(x => new DateTime(x.Month.Year, x.Month.Month, 1, 0, 0, 0, DateTimeKind.Utc)).AddMonths(1);
        var spendingRows = await _db.Transactions
            .Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.Date >= firstMonth && x.Date < afterLastMonth)
            .Select(x => new { x.Date, x.Category, x.Amount })
            .ToListAsync();
        var spentByMonthAndCategory = spendingRows
            .GroupBy(x => (x.Date.Year, x.Date.Month, Category: x.Category.ToUpperInvariant()))
            .ToDictionary(x => x.Key, x => x.Sum(v => v.Amount));

        return budgets.Select(budget =>
        {
            var key = (budget.Month.Year, budget.Month.Month, Category: budget.Category.ToUpperInvariant());
            return ToResponse(budget, spentByMonthAndCategory.TryGetValue(key, out var total) ? total : 0);
        }).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<BudgetResponse>> Create(BudgetRequest request)
    {
        if (request.LimitAmount <= 0) return BadRequest(new { message = "Budget limit must be greater than zero." });
        if (request.Month == default) return BadRequest(new { message = "A valid budget month is required." });
        if (await HasMatchingBudget(request, null)) return Conflict(new { message = "A budget already exists for this category and month." });
        var budget = new Budget { Name = request.Name.Trim(), Category = request.Category.Trim(), LimitAmount = request.LimitAmount, Month = FirstOfMonth(request.Month), AlertThreshold = request.AlertThreshold, IsActive = request.IsActive, UserId = UserId };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();
        return Ok(ToResponse(budget, await SpentAmount(budget)));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BudgetResponse>> Update(int id, BudgetRequest request)
    {
        if (request.LimitAmount <= 0) return BadRequest(new { message = "Budget limit must be greater than zero." });
        if (request.Month == default) return BadRequest(new { message = "A valid budget month is required." });
        var budget = await _db.Budgets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (budget is null) return NotFound();
        if (await HasMatchingBudget(request, id)) return Conflict(new { message = "A budget already exists for this category and month." });
        budget.Name = request.Name.Trim();
        budget.Category = request.Category.Trim();
        budget.LimitAmount = request.LimitAmount;
        budget.Month = FirstOfMonth(request.Month);
        budget.AlertThreshold = request.AlertThreshold;
        budget.IsActive = request.IsActive;
        await _db.SaveChangesAsync();
        return Ok(ToResponse(budget, await SpentAmount(budget)));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var budget = await _db.Budgets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (budget is null) return NotFound();
        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private Task<bool> HasMatchingBudget(BudgetRequest request, int? exceptId)
    {
        var month = FirstOfMonth(request.Month);
        var nextMonth = month.AddMonths(1);
        var category = request.Category.Trim().ToUpperInvariant();
        var matches = _db.Budgets.Where(x => x.UserId == UserId
            && x.Month >= month
            && x.Month < nextMonth
            && x.Category.ToUpper() == category);
        if (exceptId.HasValue) matches = matches.Where(x => x.Id != exceptId.Value);
        return matches.AnyAsync();
    }

    private static DateTime FirstOfMonth(DateTime date) => new(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    private async Task<decimal> SpentAmount(Budget budget)
    {
        var month = FirstOfMonth(budget.Month);
        var afterMonth = month.AddMonths(1);
        return await _db.Transactions
            .Where(x => x.UserId == budget.UserId && x.Type == TransactionType.Expense
                && x.Category.ToUpper() == budget.Category.ToUpper()
                && x.Date >= month && x.Date < afterMonth)
            .SumAsync(x => (decimal?)x.Amount) ?? 0m;
    }
    private static BudgetResponse ToResponse(Budget x, decimal spent) => new(x.Id, x.Name, x.Category, x.LimitAmount, spent, x.Month, x.AlertThreshold, x.IsActive);
}
