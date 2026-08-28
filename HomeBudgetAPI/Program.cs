using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.Middleware;
using HomeBudgetAPI.Repositories;
using HomeBudgetAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// =========================
// LOGGING
// =========================

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// =========================
// DATA PROTECTION
// =========================

if (builder.Environment.IsDevelopment())
{
  var keysPath =
      Path.Combine(
          builder.Environment.ContentRootPath,
          "App_Data",
          "DataProtectionKeys"
      );

  Directory.CreateDirectory(keysPath);

  builder.Services
      .AddDataProtection()
      .PersistKeysToFileSystem(
          new DirectoryInfo(keysPath)
      );
}

// =========================
// CONTROLLERS
// =========================

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter()
        )
    );

// =========================
// SWAGGER
// =========================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
  options.SwaggerDoc("v1",
      new OpenApiInfo
      {
        Title = "HomeBudgetAI API",
        Version = "v1"
      });

  options.AddSecurityDefinition("Bearer",
      new OpenApiSecurityScheme
      {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
      });

  options.AddSecurityRequirement(
      new OpenApiSecurityRequirement
      {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
      });
});

// =========================
// DATABASE
// =========================

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

var databaseProvider =
    builder.Configuration["DatabaseProvider"]
    ?? "Sqlite";

if (string.IsNullOrWhiteSpace(connectionString))
{
  throw new InvalidOperationException(
      "Database connection string is not configured."
  );
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
  if (databaseProvider.Equals(
          "Sqlite",
          StringComparison.OrdinalIgnoreCase))
  {
    options.UseSqlite(connectionString);
    return;
  }

  options.UseSqlServer(
    connectionString,
    sqlServerOptions =>
    {
      sqlServerOptions.EnableRetryOnFailure(
          maxRetryCount: 5,
          maxRetryDelay: TimeSpan.FromSeconds(30),
          errorNumbersToAdd: null
      );
    });
});

// =========================
// CORS
// =========================

builder.Services.AddCors(options =>
{
  var allowedOrigins =
      builder.Configuration
          .GetSection("Cors:AllowedOrigins")
          .Get<string[]>()
      ?? new[]
      {
        "http://localhost:4200",
        "http://127.0.0.1:4200"
      };

  options.AddPolicy("AllowAngular",
      policy =>
      {
        policy
              .WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
      });
});

// =========================
// RATE LIMITER
// =========================

builder.Services.AddRateLimiter(options =>
{
  options.RejectionStatusCode =
      StatusCodes.Status429TooManyRequests;

  options.AddFixedWindowLimiter("api", limiter =>
  {
    limiter.PermitLimit = 120;
    limiter.Window = TimeSpan.FromMinutes(1);
    limiter.QueueProcessingOrder =
        QueueProcessingOrder.OldestFirst;
    limiter.QueueLimit = 20;
  });
});

// =========================
// JWT AUTHENTICATION
// =========================

var jwtKey =
    builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is not configured."
    );

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
      options.TokenValidationParameters =
          new TokenValidationParameters
          {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer =
                  builder.Configuration["Jwt:Issuer"],

            ValidAudience =
                  builder.Configuration["Jwt:Audience"],

            IssuerSigningKey =
                  new SymmetricSecurityKey(
                      Encoding.UTF8.GetBytes(jwtKey)
                  ),

            ClockSkew =
                  TimeSpan.FromMinutes(1)
          };
    });

// =========================
// AUTHORIZATION
// =========================

builder.Services.AddAuthorization(options =>
{
  options.AddPolicy("AdminOnly",
      policy => policy.RequireRole("Admin"));

  options.AddPolicy("UserOrAdmin",
      policy => policy.RequireRole(
          "User",
          "Admin"
      ));
});

// =========================
// DEPENDENCY INJECTION
// =========================

builder.Services.AddScoped<
    IPasswordService,
    PasswordService>();

builder.Services.AddScoped<
    ITokenService,
    TokenService>();

builder.Services.AddScoped<
    IRefreshTokenService,
    RefreshTokenService>();

builder.Services.AddScoped<
    IInsightService,
    InsightService>();

builder.Services.AddScoped<
    ITransactionRepository,
    TransactionRepository>();

// =========================
// RENDER PORT
// =========================

if (builder.Environment.IsProduction())
{
  var port =
      Environment.GetEnvironmentVariable("PORT")
      ?? "8080";

  builder.WebHost.UseUrls(
      $"http://*:{port}"
  );
}

// =========================
// BUILD APP
// =========================

var app = builder.Build();

// =========================
// MIDDLEWARE
// =========================

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();

app.UseSwaggerUI();

if (builder.Configuration.GetValue<bool>("UseHttpsRedirection"))
{
  app.UseHttpsRedirection();
}

app.UseCors("AllowAngular");

app.UseRateLimiter();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers()
   .RequireRateLimiting("api");

// =========================
// DATABASE MIGRATION
// =========================

try
{
  using var scope =
      app.Services.CreateScope();

  var db =
      scope.ServiceProvider
          .GetRequiredService<AppDbContext>();

  if (databaseProvider.Equals(
          "Sqlite",
          StringComparison.OrdinalIgnoreCase))
  {
    await db.Database.EnsureCreatedAsync();
  }
  else
  {
    await db.Database.MigrateAsync();
  }

  var shouldSeedDemoData =
      app.Environment.IsDevelopment()
      || builder.Configuration.GetValue<bool>("SeedDemoData");

  if (shouldSeedDemoData)
  {
    var passwords =
        scope.ServiceProvider
            .GetRequiredService<IPasswordService>();

    await SeedData.ApplyAsync(db, passwords);
  }
}
catch (Exception ex)
{
  Console.WriteLine(
      $"Database Migration Error: {ex.Message}"
  );
}

// =========================
// RUN
// =========================

app.Run();

public partial class Program { }
