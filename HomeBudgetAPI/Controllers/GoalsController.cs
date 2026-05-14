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
public class GoalsController : ControllerBase
{
    private readonly AppDbContext _db;
    public GoalsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IReadOnlyList<GoalResponse>> List() => await _db.FinancialGoals.Where(x => x.UserId == UserId).OrderBy(x => x.DueDate).Select(x => new GoalResponse(x.Id, x.Name, x.TargetAmount, x.CurrentAmount, x.DueDate, x.Color)).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<GoalResponse>> Create(GoalRequest request)
    {
        var goal = new FinancialGoal { Name = request.Name.Trim(), TargetAmount = request.TargetAmount, CurrentAmount = request.CurrentAmount, DueDate = request.DueDate, Color = request.Color, UserId = UserId };
        _db.FinancialGoals.Add(goal);
        await _db.SaveChangesAsync();
        return Ok(new GoalResponse(goal.Id, goal.Name, goal.TargetAmount, goal.CurrentAmount, goal.DueDate, goal.Color));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<GoalResponse>> Update(int id, GoalRequest request)
    {
        var goal = await _db.FinancialGoals.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (goal is null) return NotFound();
        goal.Name = request.Name.Trim(); goal.TargetAmount = request.TargetAmount; goal.CurrentAmount = request.CurrentAmount; goal.DueDate = request.DueDate; goal.Color = request.Color;
        await _db.SaveChangesAsync();
        return Ok(new GoalResponse(goal.Id, goal.Name, goal.TargetAmount, goal.CurrentAmount, goal.DueDate, goal.Color));
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
