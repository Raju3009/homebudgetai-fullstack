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
        var start = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var spendingRows = await _db.Transactions
            .Where(x => x.UserId == userId && x.Type == TransactionType.Expense && x.Date >= start)
            .Select(x => new { x.Category, x.Amount })
            .ToListAsync();
        var spent = spendingRows
            .GroupBy(x => x.Category)
            .ToDictionary(x => x.Key, x => x.Sum(v => v.Amount));
        return budgets.Select(x => ToResponse(x, spent.TryGetValue(x.Category, out var total) ? total : 0)).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<BudgetResponse>> Create(BudgetRequest request)
    {
        if (request.LimitAmount <= 0) return BadRequest(new { message = "Budget limit must be greater than zero." });
        var budget = new Budget { Name = request.Name.Trim(), Category = request.Category.Trim(), LimitAmount = request.LimitAmount, Month = FirstOfMonth(request.Month), AlertThreshold = Math.Clamp(request.AlertThreshold, 1, 100), IsActive = request.IsActive, UserId = UserId };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();
        return Ok(ToResponse(budget, 0));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BudgetResponse>> Update(int id, BudgetRequest request)
    {
        var budget = await _db.Budgets.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (budget is null) return NotFound();
        budget.Name = request.Name.Trim();
        budget.Category = request.Category.Trim();
        budget.LimitAmount = request.LimitAmount;
        budget.Month = FirstOfMonth(request.Month);
        budget.AlertThreshold = Math.Clamp(request.AlertThreshold, 1, 100);
        budget.IsActive = request.IsActive;
        await _db.SaveChangesAsync();
        return Ok(ToResponse(budget, 0));
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
    private static DateTime FirstOfMonth(DateTime date) => new(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    private static BudgetResponse ToResponse(Budget x, decimal spent) => new(x.Id, x.Name, x.Category, x.LimitAmount, spent, x.Month, x.AlertThreshold, x.IsActive);
}
