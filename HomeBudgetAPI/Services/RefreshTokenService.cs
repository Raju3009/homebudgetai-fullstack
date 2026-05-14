using System.Security.Cryptography;
using HomeBudgetAPI.Models;

namespace HomeBudgetAPI.Services;

public interface IRefreshTokenService
{
    (string Token, RefreshToken Entity) Create(User user);
    string Hash(string token);
}

public class RefreshTokenService : IRefreshTokenService
{
    public (string Token, RefreshToken Entity) Create(User user)
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(bytes);
        return (token, new RefreshToken { TokenHash = Hash(token), UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(14) });
    }

    public string Hash(string token)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
