using System.Security.Cryptography;

namespace HomeBudgetAPI.Services;

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string password, string storedHash);
    bool NeedsRehash(string storedHash);
    string HashToken(string token);
}

public class PasswordService : IPasswordService
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 600_000;
    private const int MinimumAcceptedIterations = 10_000;
    private const int MaximumAcceptedIterations = 1_000_000;

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, KeySize);
        return $"pbkdf2${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
    }

    public bool Verify(string password, string storedHash)
    {
        if (!TryParseHash(storedHash, out var iterations, out var salt, out var expected)) return false;
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, KeySize);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    public bool NeedsRehash(string storedHash) =>
        TryParseHash(storedHash, out var iterations, out _, out _) && iterations < Iterations;

    public string HashToken(string token)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private static bool TryParseHash(string storedHash, out int iterations, out byte[] salt, out byte[] key)
    {
        iterations = 0;
        salt = Array.Empty<byte>();
        key = Array.Empty<byte>();

        var parts = storedHash.Split('$');
        if (parts.Length != 4 || parts[0] != "pbkdf2"
            || !int.TryParse(parts[1], out iterations)
            || iterations < MinimumAcceptedIterations
            || iterations > MaximumAcceptedIterations)
        {
            return false;
        }

        try
        {
            salt = Convert.FromBase64String(parts[2]);
            key = Convert.FromBase64String(parts[3]);
            return salt.Length == SaltSize && key.Length == KeySize;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
