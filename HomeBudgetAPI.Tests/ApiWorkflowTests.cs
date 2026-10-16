using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.Models;
using HomeBudgetAPI.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace HomeBudgetAPI.Tests;

public sealed class ApiWorkflowTests
{
    private const string NetlifyOrigin = "https://wondrous-khapse-cc5b19.netlify.app";
    private const string GitHubPagesOrigin = "https://raju3009.github.io";
    private const string UnapprovedOrigin = "https://unapproved.example";
    private const string TestJwtKey = "integration-tests-only-signing-key-with-more-than-32-bytes";

    [Fact]
    public async Task Cors_preflight_allows_only_configured_origins_methods_and_headers()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        foreach (var origin in new[] { NetlifyOrigin, GitHubPagesOrigin })
        {
            foreach (var method in new[] { "GET", "POST", "PUT", "DELETE" })
            {
                using var request = new HttpRequestMessage(HttpMethod.Options, "/api/Transactions");
                request.Headers.Add("Origin", origin);
                request.Headers.Add("Access-Control-Request-Method", method);
                request.Headers.Add("Access-Control-Request-Headers", "authorization,content-type");

                using var response = await client.SendAsync(request);
                Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
                Assert.Equal(origin, response.Headers.GetValues("Access-Control-Allow-Origin").Single());
                Assert.Contains(method, string.Join(',', response.Headers.GetValues("Access-Control-Allow-Methods")), StringComparison.OrdinalIgnoreCase);

                var allowedHeaders = string.Join(',', response.Headers.GetValues("Access-Control-Allow-Headers"));
                Assert.Contains("authorization", allowedHeaders, StringComparison.OrdinalIgnoreCase);
                Assert.Contains("content-type", allowedHeaders, StringComparison.OrdinalIgnoreCase);
                Assert.False(response.Headers.Contains("Access-Control-Allow-Credentials"));
            }
        }

        using var rejectedRequest = new HttpRequestMessage(HttpMethod.Options, "/api/Transactions");
        rejectedRequest.Headers.Add("Origin", UnapprovedOrigin);
        rejectedRequest.Headers.Add("Access-Control-Request-Method", "GET");
        rejectedRequest.Headers.Add("Access-Control-Request-Headers", "authorization");

        using var rejectedResponse = await client.SendAsync(rejectedRequest);
        Assert.Equal(HttpStatusCode.NoContent, rejectedResponse.StatusCode);
        Assert.False(rejectedResponse.Headers.Contains("Access-Control-Allow-Origin"));
        Assert.False(rejectedResponse.Headers.Contains("Access-Control-Allow-Methods"));
        Assert.False(rejectedResponse.Headers.Contains("Access-Control-Allow-Headers"));
    }

    [Fact]
    public async Task Transactions_are_user_scoped_and_reject_invalid_amounts()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Origin", NetlifyOrigin);
        using var unauthenticated = await client.GetAsync("/api/Transactions");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);
        using var corsResponse = await client.GetAsync("/api/Health");
        Assert.Equal(HttpStatusCode.OK, corsResponse.StatusCode);
        Assert.Equal(NetlifyOrigin, corsResponse.Headers.GetValues("Access-Control-Allow-Origin").Single());

        var firstUser = await Register(client, "first@example.com");
        using var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", new
        {
            email = firstUser.Email,
            password = "ValidPassword1!"
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var loggedInUser = await loginResponse.Content.ReadFromJsonAsync<AuthPayload>();
        Assert.NotNull(loggedInUser);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loggedInUser!.Token);

        var invalid = await client.PostAsJsonAsync("/api/Transactions", new
        {
            title = "Invalid amount",
            category = "Housing",
            amount = 0,
            type = "Expense",
            date = DateTime.UtcNow,
            notes = (string?)null
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        var created = await client.PostAsJsonAsync("/api/Transactions", new
        {
            title = "Rent",
            category = "Housing",
            amount = 1250.25m,
            type = "Expense",
            date = DateTime.UtcNow,
            notes = "Monthly payment"
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal(NetlifyOrigin, created.Headers.GetValues("Access-Control-Allow-Origin").Single());
        var transaction = await created.Content.ReadFromJsonAsync<TransactionPayload>();
        Assert.NotNull(transaction);
        Assert.Equal($"/api/Transactions/{transaction!.Id}", created.Headers.Location?.AbsolutePath);

        using var ownRead = await client.GetAsync($"/api/Transactions/{transaction.Id}");
        Assert.Equal(HttpStatusCode.OK, ownRead.StatusCode);
        var readTransaction = await ownRead.Content.ReadFromJsonAsync<TransactionPayload>();
        Assert.Equal(transaction.Id, readTransaction!.Id);

        var secondUser = await Register(client, "second@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secondUser.Token);

        using var listResponse = await client.GetAsync("/api/Transactions?page=1&pageSize=10");
        Assert.Equal(NetlifyOrigin, listResponse.Headers.GetValues("Access-Control-Allow-Origin").Single());
        var list = await listResponse.Content.ReadFromJsonAsync<PagedTransactions>();
        Assert.NotNull(list);
        Assert.Empty(list.Items);

        using var foreignRead = await client.GetAsync($"/api/Transactions/{transaction.Id}");
        Assert.Equal(HttpStatusCode.NotFound, foreignRead.StatusCode);

        var update = await client.PutAsJsonAsync($"/api/Transactions/{transaction!.Id}", new
        {
            title = "Changed rent",
            category = "Housing",
            amount = 900m,
            type = "Expense",
            date = DateTime.UtcNow,
            notes = (string?)null
        });
        Assert.Equal(HttpStatusCode.NotFound, update.StatusCode);
    }

    [Fact]
    public async Task Transaction_export_includes_all_rows_and_neutralizes_formula_fields()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var user = await Register(client, "export@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.Token);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var dbUser = await db.Users.SingleAsync(x => x.Email == user.Email);
            db.Transactions.AddRange(Enumerable.Range(0, 105).Select(index => new BudgetTransaction
            {
                Title = index == 0 ? "=1+1" : $"Transaction {index}",
                Category = index == 0 ? "Food,Home" : "Food",
                Amount = index + 1,
                Type = TransactionType.Expense,
                Date = DateTime.UtcNow.AddDays(-index),
                Notes = index == 0 ? "+SUM(1,1)" : null,
                UserId = dbUser.Id
            }));
            await db.SaveChangesAsync();
        }

        using var response = await client.GetAsync("/api/Transactions/export?type=Expense");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var csv = await response.Content.ReadAsStringAsync();
        var rows = csv.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
        Assert.Equal(106, rows.Length);
        Assert.Contains("\"Food,Home\"", csv);
        Assert.Contains("\"'=1+1\"", csv);
        Assert.Contains("\"'+SUM(1,1)\"", csv);
        Assert.Contains(rows, row => row.Contains("\"Transaction 104\",105", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Budget_spent_amount_matches_the_budget_month()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var user = await Register(client, "budget@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.Token);

        var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var priorMonth = currentMonth.AddMonths(-1);
        await AddExpense(client, "Groceries last month", 40m, priorMonth.AddDays(5));
        await AddExpense(client, "Groceries this month", 90m, currentMonth.AddDays(5));
        var lastMonthBudget = await CreateBudget(client, "Last month", priorMonth, 300m);
        var thisMonthBudget = await CreateBudget(client, "This month", currentMonth, 400m, "food");
        Assert.Equal(40m, lastMonthBudget.SpentAmount);
        Assert.Equal(90m, thisMonthBudget.SpentAmount);

        using var update = await client.PutAsJsonAsync($"/api/Budgets/{thisMonthBudget.Id}", new
        {
            name = thisMonthBudget.Name,
            category = thisMonthBudget.Category,
            limitAmount = 450m,
            month = currentMonth,
            alertThreshold = 80,
            isActive = true
        });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var updatedBudget = await update.Content.ReadFromJsonAsync<BudgetPayload>();
        Assert.Equal(90m, updatedBudget!.SpentAmount);

        var budgets = await client.GetFromJsonAsync<List<BudgetPayload>>("/api/Budgets");
        Assert.NotNull(budgets);
        Assert.Equal(40m, budgets.Single(x => x.Name == "Last month").SpentAmount);
        Assert.Equal(90m, budgets.Single(x => x.Name == "This month").SpentAmount);

        using var duplicate = await client.PostAsJsonAsync("/api/Budgets", new
        {
            name = "Duplicate food budget",
            category = "FOOD",
            limitAmount = 500m,
            month = currentMonth,
            alertThreshold = 80,
            isActive = true
        });
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
    }

    [Fact]
    public void Password_hashes_use_salts_reject_malformed_values_and_identify_legacy_work_factors()
    {
        const string password = "ValidPassword1!";
        var service = new PasswordService();
        var currentHash = service.Hash(password);
        var legacySalt = RandomNumberGenerator.GetBytes(16);
        var legacyKey = Rfc2898DeriveBytes.Pbkdf2(password, legacySalt, 100_000, HashAlgorithmName.SHA256, 32);
        var legacyHash = $"pbkdf2$100000${Convert.ToBase64String(legacySalt)}${Convert.ToBase64String(legacyKey)}";

        Assert.True(service.Verify(password, currentHash));
        Assert.False(service.Verify("wrong-password", currentHash));
        Assert.False(service.Verify(password, "pbkdf2$999999999$bad$bad"));
        Assert.False(service.Verify(password, "malformed"));
        Assert.False(service.NeedsRehash(currentHash));
        Assert.True(service.NeedsRehash(legacyHash));
        Assert.True(service.Verify(password, legacyHash));
    }

    [Fact]
    public async Task Successful_login_upgrades_legacy_password_hashes()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        const string email = "legacy@example.com";
        const string password = "ValidPassword1!";
        var salt = RandomNumberGenerator.GetBytes(16);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new User
            {
                FullName = "Legacy User",
                Email = email,
                PasswordHash = $"pbkdf2$100000${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}"
            });
            await db.SaveChangesAsync();
        }

        using var login = await client.PostAsJsonAsync("/api/Auth/login", new { email, password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var savedHash = await verifyDb.Users.AsNoTracking().Where(x => x.Email == email).Select(x => x.PasswordHash).SingleAsync();
        Assert.StartsWith("pbkdf2$600000$", savedHash, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Contact_endpoint_validates_input_and_ignores_client_controlled_entity_fields()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        using var invalid = await client.PostAsJsonAsync("/api/Contact", new
        {
            name = "Contact",
            email = "invalid-email",
            message = "Hello"
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        using var submitted = await client.PostAsJsonAsync("/api/Contact", new
        {
            id = 900,
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            name = "  Contact Person  ",
            email = "Contact@example.com",
            message = "  Please contact me.  "
        });
        Assert.Equal(HttpStatusCode.OK, submitted.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var saved = await db.ContactMessages.SingleAsync();
        Assert.Equal(1, saved.Id);
        Assert.Equal("Contact Person", saved.Name);
        Assert.Equal("contact@example.com", saved.Email);
        Assert.Equal("Please contact me.", saved.Message);
        Assert.True(saved.CreatedAt > new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public async Task Authentication_rejects_invalid_registration_credentials_and_tokens()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        using var invalidRegistration = await client.PostAsJsonAsync("/api/Auth/register", new
        {
            fullName = "",
            email = "invalid-email",
            password = "short"
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalidRegistration.StatusCode);

        using var missingCredentials = await client.PostAsJsonAsync("/api/Auth/login", new { });
        Assert.Equal(HttpStatusCode.BadRequest, missingCredentials.StatusCode);

        var user = await Register(client, "auth@example.com");
        using var duplicateRegistration = await client.PostAsJsonAsync("/api/Auth/register", new
        {
            fullName = "Duplicate User",
            email = user.Email,
            password = "ValidPassword1!"
        });
        Assert.Equal(HttpStatusCode.Conflict, duplicateRegistration.StatusCode);

        using var wrongPassword = await client.PostAsJsonAsync("/api/Auth/login", new
        {
            email = user.Email,
            password = "IncorrectPassword1!"
        });
        using var unknownAccount = await client.PostAsJsonAsync("/api/Auth/login", new
        {
            email = "unknown@example.com",
            password = "IncorrectPassword1!"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownAccount.StatusCode);
        Assert.Equal(await wrongPassword.Content.ReadAsStringAsync(), await unknownAccount.Content.ReadAsStringAsync());

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            CreateTestToken("different-signing-key-with-more-than-32-bytes", DateTime.UtcNow.AddHours(1)));
        using var invalidToken = await client.GetAsync("/api/Auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, invalidToken.StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            CreateTestToken(TestJwtKey, DateTime.UtcNow.AddHours(-1)));
        using var expiredToken = await client.GetAsync("/api/Auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, expiredToken.StatusCode);
    }

    [Fact]
    public async Task Savings_goal_can_be_created_and_updated_for_the_current_user()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var user = await Register(client, "goal@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.Token);

        using var invalidGoal = await client.PostAsJsonAsync("/api/Goals", new
        {
            name = "Invalid goal",
            targetAmount = 0m,
            currentAmount = 0m,
            dueDate = DateTime.UtcNow.AddMonths(4),
            color = "#10b981"
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalidGoal.StatusCode);

        using var created = await client.PostAsJsonAsync("/api/Goals", new
        {
            name = "Emergency fund",
            targetAmount = 5000m,
            currentAmount = 125m,
            dueDate = DateTime.UtcNow.AddMonths(4),
            color = "#10b981"
        });
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var goal = await created.Content.ReadFromJsonAsync<GoalPayload>();
        Assert.NotNull(goal);

        using var updated = await client.PutAsJsonAsync($"/api/Goals/{goal!.Id}", new
        {
            name = "Emergency reserve",
            targetAmount = 6000m,
            currentAmount = 250m,
            dueDate = DateTime.UtcNow.AddMonths(5),
            color = "#2563eb"
        });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var saved = await updated.Content.ReadFromJsonAsync<GoalPayload>();
        Assert.NotNull(saved);
        Assert.Equal("Emergency reserve", saved.Name);
        Assert.Equal(250m, saved.CurrentAmount);
    }

    [Fact]
    public async Task Password_recovery_does_not_disclose_tokens_or_account_existence()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        await Register(client, "reset@example.com");

        using var knownAccount = await client.PostAsJsonAsync("/api/Auth/forgot-password", new { email = "reset@example.com" });
        using var unknownAccount = await client.PostAsJsonAsync("/api/Auth/forgot-password", new { email = "unknown@example.com" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, knownAccount.StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, unknownAccount.StatusCode);
        var knownBody = await knownAccount.Content.ReadAsStringAsync();
        var unknownBody = await unknownAccount.Content.ReadAsStringAsync();
        Assert.Equal(knownBody, unknownBody);
        Assert.DoesNotContain("resetToken", knownBody, StringComparison.OrdinalIgnoreCase);

        using var invalidEmail = await client.PostAsJsonAsync("/api/Auth/forgot-password", new { email = "invalid-email" });
        Assert.Equal(HttpStatusCode.BadRequest, invalidEmail.StatusCode);
    }

    [Fact]
    public async Task Account_finance_and_notification_endpoints_round_trip_data()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var user = await Register(client, "account@example.com");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.Token);

        using var createdTransaction = await client.PostAsJsonAsync("/api/Transactions", new
        {
            title = "Utility bill",
            category = "Utilities",
            amount = 72.50m,
            type = "Expense",
            date = DateTime.UtcNow,
            notes = "First entry"
        });
        Assert.Equal(HttpStatusCode.Created, createdTransaction.StatusCode);
        var transaction = await createdTransaction.Content.ReadFromJsonAsync<TransactionPayload>();
        Assert.NotNull(transaction);

        using var updatedTransaction = await client.PutAsJsonAsync($"/api/Transactions/{transaction!.Id}", new
        {
            title = "Electric bill",
            category = "Utilities",
            amount = 80m,
            type = "Expense",
            date = DateTime.UtcNow,
            notes = "Updated entry"
        });
        Assert.Equal(HttpStatusCode.OK, updatedTransaction.StatusCode);

        using var transactionExport = await client.GetAsync("/api/Transactions/export?type=Expense");
        Assert.Equal(HttpStatusCode.OK, transactionExport.StatusCode);
        Assert.Contains("Electric bill", await transactionExport.Content.ReadAsStringAsync());

        var report = await client.GetFromJsonAsync<ReportPayload>($"/api/Reports/summary?period=monthly&month={DateTime.UtcNow:yyyy-MM}");
        Assert.NotNull(report);
        Assert.Equal(80m, report.Expenses);
        using var invalidReportPeriod = await client.GetAsync("/api/Reports/summary?period=weekly");
        Assert.Equal(HttpStatusCode.BadRequest, invalidReportPeriod.StatusCode);
        using var invalidReportMonth = await client.GetAsync("/api/Reports/summary?period=monthly&month=2026-13");
        Assert.Equal(HttpStatusCode.BadRequest, invalidReportMonth.StatusCode);
        using var reportExport = await client.GetAsync($"/api/Reports/export?period=monthly&month={DateTime.UtcNow:yyyy-MM}");
        Assert.Equal(HttpStatusCode.OK, reportExport.StatusCode);
        Assert.Contains("Expenses,80", await reportExport.Content.ReadAsStringAsync());
        using var invalidReportExport = await client.GetAsync("/api/Reports/export?period=monthly&month=not-a-month");
        Assert.Equal(HttpStatusCode.BadRequest, invalidReportExport.StatusCode);

        using var budgetResponse = await client.PostAsJsonAsync("/api/Budgets", new
        {
            name = "Utilities",
            category = "Utilities",
            limitAmount = 500m,
            month = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc),
            alertThreshold = 75,
            isActive = true
        });
        Assert.Equal(HttpStatusCode.OK, budgetResponse.StatusCode);
        var budget = await budgetResponse.Content.ReadFromJsonAsync<BudgetPayload>();
        Assert.NotNull(budget);
        using var updatedBudget = await client.PutAsJsonAsync($"/api/Budgets/{budget!.Id}", new
        {
            name = "Home utilities",
            category = "Utilities",
            limitAmount = 600m,
            month = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc),
            alertThreshold = 80,
            isActive = true
        });
        Assert.Equal(HttpStatusCode.OK, updatedBudget.StatusCode);
        var listedBudgets = await client.GetFromJsonAsync<List<BudgetPayload>>("/api/Budgets");
        Assert.Equal(80m, listedBudgets!.Single(x => x.Id == budget.Id).SpentAmount);
        using var deletedBudget = await client.DeleteAsync($"/api/Budgets/{budget.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deletedBudget.StatusCode);

        var notifications = await client.GetFromJsonAsync<List<NotificationPayload>>("/api/Notifications");
        Assert.NotNull(notifications);
        var unread = notifications.First(x => !x.IsRead);
        using var markedRead = await client.PostAsync($"/api/Notifications/{unread.Id}/read", null);
        Assert.Equal(HttpStatusCode.NoContent, markedRead.StatusCode);

        using var settingsResponse = await client.PutAsJsonAsync("/api/Settings", new
        {
            currency = "EUR",
            language = "en",
            theme = "dark",
            emailNotifications = true,
            pushNotifications = false,
            monthlyDigest = true
        });
        Assert.Equal(HttpStatusCode.OK, settingsResponse.StatusCode);
        var settings = await settingsResponse.Content.ReadFromJsonAsync<SettingsPayload>();
        Assert.Equal("EUR", settings!.Currency);

        using var profileResponse = await client.PutAsJsonAsync("/api/Profile", new { fullName = "Updated Account", avatarUrl = (string?)null });
        Assert.Equal(HttpStatusCode.OK, profileResponse.StatusCode);
        var currentProfile = await client.GetFromJsonAsync<ProfilePayload>("/api/Auth/me");
        Assert.Equal("Updated Account", currentProfile!.FullName);

        using var changePassword = await client.PostAsJsonAsync("/api/Profile/change-password", new
        {
            currentPassword = "ValidPassword1!",
            newPassword = "ReplacementPassword2!"
        });
        Assert.Equal(HttpStatusCode.OK, changePassword.StatusCode);
        using var revokedRefresh = await client.PostAsJsonAsync("/api/Auth/refresh", new { refreshToken = user.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, revokedRefresh.StatusCode);
        using var newLogin = await client.PostAsJsonAsync("/api/Auth/login", new { email = user.Email, password = "ReplacementPassword2!" });
        Assert.Equal(HttpStatusCode.OK, newLogin.StatusCode);

        using var deletedTransaction = await client.DeleteAsync($"/api/Transactions/{transaction.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deletedTransaction.StatusCode);
    }

    private static async Task<AuthPayload> Register(HttpClient client, string email)
    {
        using var response = await client.PostAsJsonAsync("/api/Auth/register", new
        {
            fullName = "Test User",
            email,
            password = "ValidPassword1!"
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthPayload>())!;
    }

    private static string CreateTestToken(string key, DateTime expiresAt)
    {
        var token = new JwtSecurityToken(
            issuer: "HomeBudgetAI.Tests",
            audience: "HomeBudgetAI.Tests",
            claims: [new Claim(ClaimTypes.NameIdentifier, "1")],
            notBefore: DateTime.UtcNow.AddHours(-2),
            expires: expiresAt,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static async Task AddExpense(HttpClient client, string title, decimal amount, DateTime date)
    {
        using var response = await client.PostAsJsonAsync("/api/Transactions", new
        {
            title,
            category = "Food",
            amount,
            type = "Expense",
            date,
            notes = (string?)null
        });
        response.EnsureSuccessStatusCode();
    }

    private static async Task<BudgetPayload> CreateBudget(HttpClient client, string name, DateTime month, decimal limitAmount, string category = "Food")
    {
        using var response = await client.PostAsJsonAsync("/api/Budgets", new
        {
            name,
            category,
            limitAmount,
            month,
            alertThreshold = 80,
            isActive = true
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<BudgetPayload>())!;
    }

    private sealed record AuthPayload(string Token, string Email, string FullName, string Role, DateTime ExpiresAt, string? RefreshToken);
    private sealed record TransactionPayload(int Id, string Title, string Category, decimal Amount, string Type, DateTime Date, string? Notes);
    private sealed record PagedTransactions(IReadOnlyList<TransactionPayload> Items, int Page, int PageSize, int TotalItems, int TotalPages);
    private sealed record BudgetPayload(int Id, string Name, string Category, decimal LimitAmount, decimal SpentAmount, DateTime Month, int AlertThreshold, bool IsActive);
    private sealed record GoalPayload(int Id, string Name, decimal TargetAmount, decimal CurrentAmount, DateTime DueDate, string Color);
    private sealed record ReportPayload(decimal Income, decimal Expenses, decimal Balance, decimal SavingsRate);
    private sealed record NotificationPayload(int Id, string Title, string Message, string Type, bool IsRead, DateTime CreatedAt);
    private sealed record SettingsPayload(string Currency, string Language, string Theme, bool EmailNotifications, bool PushNotifications, bool MonthlyDigest);
    private sealed record ProfilePayload(int Id, string FullName, string Email, string Role, string? AvatarUrl);

    private sealed class ApiFactory : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection _connection = new("Data Source=:memory:");

        public ApiFactory()
        {
            _connection.Open();
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Jwt:Key", TestJwtKey);
            builder.UseSetting("Jwt:Issuer", "HomeBudgetAI.Tests");
            builder.UseSetting("Jwt:Audience", "HomeBudgetAI.Tests");
            builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DatabaseProvider"] = "Sqlite",
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["Jwt:Key"] = TestJwtKey,
                ["Jwt:Issuer"] = "HomeBudgetAI.Tests",
                ["Jwt:Audience"] = "HomeBudgetAI.Tests",
                ["Cors:AllowedOrigins:0"] = NetlifyOrigin,
                ["Cors:AllowedOrigins:1"] = GitHubPagesOrigin,
                ["SeedDemoData"] = "false",
                ["UseHttpsRedirection"] = "false"
            }));
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.RemoveAll<AppDbContext>();
                services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
            });
        }
    }
}
