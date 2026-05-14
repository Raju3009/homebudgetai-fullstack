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
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SettingsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<UserSettingResponse> Get()
    {
        var setting = await CurrentOrCreate();
        return ToResponse(setting);
    }

    [HttpPut]
    public async Task<UserSettingResponse> Update(UserSettingRequest request)
    {
        var setting = await CurrentOrCreate();
        setting.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency.Trim().ToUpperInvariant();
        setting.Language = string.IsNullOrWhiteSpace(request.Language) ? "en" : request.Language.Trim();
        setting.Theme = string.IsNullOrWhiteSpace(request.Theme) ? "system" : request.Theme.Trim();
        setting.EmailNotifications = request.EmailNotifications;
        setting.PushNotifications = request.PushNotifications;
        setting.MonthlyDigest = request.MonthlyDigest;
        await _db.SaveChangesAsync();
        return ToResponse(setting);
    }

    private async Task<UserSetting> CurrentOrCreate()
    {
        var setting = await _db.UserSettings.FirstOrDefaultAsync(x => x.UserId == UserId);
        if (setting is not null) return setting;
        setting = new UserSetting { UserId = UserId };
        _db.UserSettings.Add(setting);
        await _db.SaveChangesAsync();
        return setting;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static UserSettingResponse ToResponse(UserSetting x) => new(x.Currency, x.Language, x.Theme, x.EmailNotifications, x.PushNotifications, x.MonthlyDigest);
}
