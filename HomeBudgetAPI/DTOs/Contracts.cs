using HomeBudgetAPI.Models;

namespace HomeBudgetAPI.DTOs;

public record AuthRequest(string Email, string Password);
public record RegisterRequest(string FullName, string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record RefreshTokenRequest(string RefreshToken);
public record AuthResponse(string Token, string Email, string FullName, string Role, DateTime ExpiresAt, string? RefreshToken = null);
public record ProfileResponse(int Id, string FullName, string Email, string Role, string? AvatarUrl);
public record UpdateProfileRequest(string FullName, string? AvatarUrl);

public record TransactionRequest(string Title, string Category, decimal Amount, TransactionType Type, DateTime Date, string? Notes);
public record TransactionResponse(int Id, string Title, string Category, decimal Amount, TransactionType Type, DateTime Date, string? Notes);
public record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems, int TotalPages);

public record BudgetRequest(string Name, string Category, decimal LimitAmount, DateTime Month, int AlertThreshold, bool IsActive = true);
public record BudgetResponse(int Id, string Name, string Category, decimal LimitAmount, decimal SpentAmount, DateTime Month, int AlertThreshold, bool IsActive);
public record GoalRequest(string Name, decimal TargetAmount, decimal CurrentAmount, DateTime DueDate, string Color);
public record GoalResponse(int Id, string Name, decimal TargetAmount, decimal CurrentAmount, DateTime DueDate, string Color);
public record NotificationResponse(int Id, string Title, string Message, string Type, bool IsRead, DateTime CreatedAt);
public record UserSettingRequest(string Currency, string Language, string Theme, bool EmailNotifications, bool PushNotifications, bool MonthlyDigest);
public record UserSettingResponse(string Currency, string Language, string Theme, bool EmailNotifications, bool PushNotifications, bool MonthlyDigest);
public record ReportSummary(decimal Income, decimal Expenses, decimal Balance, decimal SavingsRate, IReadOnlyList<CategoryTotal> Categories, IReadOnlyList<MonthlyTotal> Months, IReadOnlyList<string> Insights, DateTime GeneratedAt);

public record DashboardSummary(
    decimal Income,
    decimal Expenses,
    decimal Balance,
    decimal SavingsRate,
    IReadOnlyList<CategoryTotal> CategoryTotals,
    IReadOnlyList<MonthlyTotal> MonthlyTotals,
    IReadOnlyList<TransactionResponse> RecentTransactions,
    IReadOnlyList<string> Suggestions);

public record CategoryTotal(string Category, decimal Total);
public record MonthlyTotal(string Month, decimal Income, decimal Expenses);
