using System.Security.Claims;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Models;
using HomeBudgetAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudgetAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordService _passwords;
    private readonly ITokenService _tokens;

    public AuthController(AppDbContext db, IPasswordService passwords, ITokenService tokens)
    {
        _db = db;
        _passwords = passwords;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (request.Password.Length < 8) return BadRequest(new { message = "Password must be at least 8 characters." });
        if (await _db.Users.AnyAsync(x => x.Email == email)) return Conflict(new { message = "User already exists." });

        var user = new User { FullName = request.FullName.Trim(), Email = email, PasswordHash = _passwords.Hash(request.Password), Role = "User" };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        var auth = _tokens.Create(user);
        return Ok(new AuthResponse(auth.Token, user.Email, user.FullName, user.Role, auth.ExpiresAt));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(AuthRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user is null || !_passwords.Verify(request.Password, user.PasswordHash)) return Unauthorized(new { message = "Invalid credentials." });
        var auth = _tokens.Create(user);
        return Ok(new AuthResponse(auth.Token, user.Email, user.FullName, user.Role, auth.ExpiresAt));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user is not null)
        {
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("=", "").Replace("+", "");
            user.ResetTokenHash = _passwords.HashToken(token);
            user.ResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Reset token generated for demo delivery.", resetToken = token });
        }

        return Ok(new { message = "If this email exists, reset instructions will be sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var tokenHash = _passwords.HashToken(request.Token);
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email && x.ResetTokenHash == tokenHash && x.ResetTokenExpiresAt > DateTime.UtcNow);
        if (user is null) return BadRequest(new { message = "Invalid or expired reset token." });
        user.PasswordHash = _passwords.Hash(request.NewPassword);
        user.ResetTokenHash = null;
        user.ResetTokenExpiresAt = null;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Password reset successful." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> Me()
    {
        var user = await CurrentUser();
        return Ok(new ProfileResponse(user.Id, user.FullName, user.Email, user.Role, user.AvatarUrl));
    }

    private async Task<User> CurrentUser()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _db.Users.FindAsync(id) ?? throw new InvalidOperationException("User not found.");
    }
}
