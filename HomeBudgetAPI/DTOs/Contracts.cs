using HomeBudgetAPI.Models;

namespace HomeBudgetAPI.DTOs;

public record AuthRequest(string Email, string Password);
public record RegisterRequest(string FullName, string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record AuthResponse(string Token, string Email, string FullName, string Role, DateTime ExpiresAt);
public record ProfileResponse(int Id, string FullName, string Email, string Role, string? AvatarUrl);
public record UpdateProfileRequest(string FullName, string? AvatarUrl);

public record TransactionRequest(string Title, string Category, decimal Amount, TransactionType Type, DateTime Date, string? Notes);
public record TransactionResponse(int Id, string Title, string Category, decimal Amount, TransactionType Type, DateTime Date, string? Notes);
public record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems, int TotalPages);

public record DashboardSummary(
    decimal Income,
    decimal Expenses,
    decimal Balance,
    IReadOnlyList<CategoryTotal> CategoryTotals,
    IReadOnlyList<MonthlyTotal> MonthlyTotals,
    IReadOnlyList<string> Suggestions);

public record CategoryTotal(string Category, decimal Total);
public record MonthlyTotal(string Month, decimal Income, decimal Expenses);
