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
    private readonly IRefreshTokenService _refreshTokens;

    public AuthController(AppDbContext db, IPasswordService passwords, ITokenService tokens, IRefreshTokenService refreshTokens)
    {
        _db = db;
        _passwords = passwords;
        _tokens = tokens;
        _refreshTokens = refreshTokens;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (request.Password.Length < 8) return BadRequest(new { message = "Password must be at least 8 characters." });
        if (await _db.Users.AnyAsync(x => x.Email == email)) return Conflict(new { message = "User already exists." });

        var user = new User { FullName = request.FullName.Trim(), Email = email, PasswordHash = _passwords.Hash(request.Password), Role = "User" };
        user.Setting = new UserSetting();
        user.Notifications.Add(new Notification { Title = "Welcome to HomeBudgetAI", Message = "Your premium finance workspace is ready.", Type = "Success" });
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(await CreateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(AuthRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user is null || !_passwords.Verify(request.Password, user.PasswordHash)) return Unauthorized(new { message = "Invalid credentials." });
        return Ok(await CreateAuthResponse(user));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest request)
    {
        var hash = _refreshTokens.Hash(request.RefreshToken);
        var token = await _db.RefreshTokens.Include(x => x.User).FirstOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAt == null && x.ExpiresAt > DateTime.UtcNow);
        if (token?.User is null) return Unauthorized(new { message = "Refresh token is invalid or expired." });
        token.RevokedAt = DateTime.UtcNow;
        return Ok(await CreateAuthResponse(token.User));
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

    private async Task<AuthResponse> CreateAuthResponse(User user)
    {
        var auth = _tokens.Create(user);
        var refresh = _refreshTokens.Create(user);
        _db.RefreshTokens.Add(refresh.Entity);
        await _db.SaveChangesAsync();
        return new AuthResponse(auth.Token, user.Email, user.FullName, user.Role, auth.ExpiresAt, refresh.Token);
    }

    private async Task<User> CurrentUser()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _db.Users.FindAsync(id) ?? throw new InvalidOperationException("User not found.");
    }
}
