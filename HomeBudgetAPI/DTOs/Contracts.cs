using System.ComponentModel.DataAnnotations;
using HomeBudgetAPI.Models;

namespace HomeBudgetAPI.DTOs;

public record AuthRequest(
    [Required, EmailAddress, StringLength(180)] string Email,
    [Required, StringLength(128, MinimumLength = 8)] string Password);
public record RegisterRequest(
    [Required, StringLength(120)] string FullName,
    [Required, EmailAddress, StringLength(180)] string Email,
    [Required, StringLength(128, MinimumLength = 8)] string Password);
public record ForgotPasswordRequest(
    [Required, EmailAddress, StringLength(180)] string Email);
public record ResetPasswordRequest(
    [Required, EmailAddress, StringLength(180)] string Email,
    [Required, StringLength(256)] string Token,
    [Required, StringLength(128, MinimumLength = 8)] string NewPassword);
public record ChangePasswordRequest(
    [Required, StringLength(128, MinimumLength = 8)] string CurrentPassword,
    [Required, StringLength(128, MinimumLength = 8)] string NewPassword);
public record RefreshTokenRequest(
    [Required, StringLength(256)] string RefreshToken);
public record AuthResponse(string Token, string Email, string FullName, string Role, DateTime ExpiresAt, string? RefreshToken = null);
public record ProfileResponse(int Id, string FullName, string Email, string Role, string? AvatarUrl);
public record UpdateProfileRequest(
    [Required, StringLength(120)] string FullName,
    [StringLength(512), Url] string? AvatarUrl);

public record TransactionRequest(
    [Required, StringLength(160)] string Title,
    [Required, StringLength(80)] string Category,
    [Range(typeof(decimal), "0.01", "9999999999999999.99")] decimal Amount,
    [EnumDataType(typeof(TransactionType))] TransactionType Type,
    DateTime Date,
    [StringLength(500)] string? Notes);
public record TransactionResponse(int Id, string Title, string Category, decimal Amount, TransactionType Type, DateTime Date, string? Notes);
public record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems, int TotalPages);

public record BudgetRequest(
    [Required, StringLength(120)] string Name,
    [Required, StringLength(80)] string Category,
    [Range(typeof(decimal), "0.01", "9999999999999999.99")] decimal LimitAmount,
    DateTime Month,
    [Range(1, 100)] int AlertThreshold,
    bool IsActive = true);
public record BudgetResponse(int Id, string Name, string Category, decimal LimitAmount, decimal SpentAmount, DateTime Month, int AlertThreshold, bool IsActive);
public record GoalRequest(
    [Required, StringLength(120)] string Name,
    [Range(typeof(decimal), "0.01", "9999999999999999.99")] decimal TargetAmount,
    [Range(typeof(decimal), "0", "9999999999999999.99")] decimal CurrentAmount,
    DateTime DueDate,
    [Required, RegularExpression("^#[0-9a-fA-F]{6}$")] string Color);
public record GoalResponse(int Id, string Name, decimal TargetAmount, decimal CurrentAmount, DateTime DueDate, string Color);
public record NotificationResponse(int Id, string Title, string Message, string Type, bool IsRead, DateTime CreatedAt);
public record UserSettingRequest(
    [Required, RegularExpression("^(INR|USD|EUR|GBP)$", MatchTimeoutInMilliseconds = 100)] string Currency,
    [Required, StringLength(16)] string Language,
    [Required, RegularExpression("^(system|light|dark)$", MatchTimeoutInMilliseconds = 100)] string Theme,
    bool EmailNotifications,
    bool PushNotifications,
    bool MonthlyDigest);
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
