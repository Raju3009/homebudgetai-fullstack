using System.Security.Claims;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudgetAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordService _passwords;

    public ProfileController(AppDbContext db, IPasswordService passwords)
    {
        _db = db;
        _passwords = passwords;
    }

    [HttpPut]
    public async Task<ActionResult<ProfileResponse>> Update(UpdateProfileRequest request)
    {
        var user = await CurrentUser();
        user.FullName = request.FullName.Trim();
        user.AvatarUrl = request.AvatarUrl;
        await _db.SaveChangesAsync();
        return Ok(new ProfileResponse(user.Id, user.FullName, user.Email, user.Role, user.AvatarUrl));
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var user = await CurrentUser();
        if (!_passwords.Verify(request.CurrentPassword, user.PasswordHash)) return BadRequest(new { message = "Current password is incorrect." });
        if (request.NewPassword.Length < 8) return BadRequest(new { message = "Password must be at least 8 characters." });
        user.PasswordHash = _passwords.Hash(request.NewPassword);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Password changed." });
    }

    private async Task<Models.User> CurrentUser()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _db.Users.FirstAsync(x => x.Id == id);
    }
}
