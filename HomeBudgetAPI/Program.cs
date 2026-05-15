using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.Middleware;
using HomeBudgetAPI.Repositories;
using HomeBudgetAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

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
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DATABASE_URL"];

var provider =
    builder.Configuration["DatabaseProvider"]
    ?? "SqlServer";

if (string.IsNullOrWhiteSpace(connectionString))
{
  throw new InvalidOperationException(
      "Database connection string is not configured."
  );
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
  if (
      provider.Equals(
          "PostgreSQL",
          StringComparison.OrdinalIgnoreCase
      )
      ||
      provider.Equals(
          "Postgres",
          StringComparison.OrdinalIgnoreCase
      )
  )
  {
    options.UseNpgsql(connectionString);
  }
  else
  {
    options.UseSqlServer(connectionString);
  }
});

// =========================
// CORS
// =========================

var allowedOrigins =
    builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
  options.AddPolicy("Frontend", policy =>
  {
    if (
        allowedOrigins.Length == 0
        || allowedOrigins.Contains("*")
    )
    {
      policy.AllowAnyOrigin();
    }
    else
    {
      policy.WithOrigins(allowedOrigins);
    }

    policy
        .AllowAnyHeader()
        .AllowAnyMethod();
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

if (!app.Environment.IsProduction())
{
  app.UseHttpsRedirection();
}

app.UseCors("Frontend");

app.UseRateLimiter();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers()
   .RequireRateLimiting("api");

// =========================
// SEED DATA
// =========================

if (
    builder.Configuration.GetValue(
        "SeedDemoData",
        true
    )
)
{
  try
  {
    using var scope =
        app.Services.CreateScope();

    var db =
        scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

    var passwords =
        scope.ServiceProvider
            .GetRequiredService<IPasswordService>();

    // Uncomment if needed

     await db.Database.MigrateAsync();

    await SeedData.ApplyAsync(
        db,
        passwords
    );
  }
  catch (Exception ex)
  {
    Console.WriteLine(
        $"Startup Error: {ex.Message}"
    );
  }
}

// =========================
// RUN
// =========================

app.Run();

public partial class Program { }
