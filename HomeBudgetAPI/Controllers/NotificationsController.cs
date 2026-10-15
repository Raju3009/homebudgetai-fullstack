using System.Security.Claims;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.DTOs;
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

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
