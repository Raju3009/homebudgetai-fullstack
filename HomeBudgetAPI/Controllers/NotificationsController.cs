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
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;
    public NotificationsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IReadOnlyList<NotificationResponse>> List()
    {
        await EnsureDefaults();
        return await _db.Notifications.Where(x => x.UserId == UserId).OrderByDescending(x => x.CreatedAt).Take(40).Select(x => new NotificationResponse(x.Id, x.Title, x.Message, x.Type, x.IsRead, x.CreatedAt)).ToListAsync();
    }

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> Read(int id)
    {
        var item = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (item is null) return NotFound();
        item.IsRead = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task EnsureDefaults()
    {
        if (await _db.Notifications.AnyAsync(x => x.UserId == UserId)) return;
        _db.Notifications.AddRange(
            new Notification { UserId = UserId, Title = "Budget alert", Message = "Food spending is nearing your monthly threshold.", Type = "Budget" },
            new Notification { UserId = UserId, Title = "AI insight ready", Message = "Savings improved 12% compared with last month.", Type = "Insight" },
            new Notification { UserId = UserId, Title = "Report generated", Message = "Your monthly financial summary is ready to export.", Type = "Report", IsRead = true });
        await _db.SaveChangesAsync();
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
