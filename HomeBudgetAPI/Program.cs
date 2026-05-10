using System.Text;
using System.Text.Json.Serialization;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.Middleware;
using HomeBudgetAPI.Repositories;
using HomeBudgetAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
  options.SwaggerDoc("v1", new OpenApiInfo
  {
    Title = "HomeBudgetAI API",
    Version = "v1"
  });

  options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
  {
    Name = "Authorization",
    Type = SecuritySchemeType.Http,
    Scheme = "bearer",
    BearerFormat = "JWT",
    In = ParameterLocation.Header
  });

  options.AddSecurityRequirement(new OpenApiSecurityRequirement
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

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DATABASE_URL"];

var provider =
    builder.Configuration["DatabaseProvider"]
    ?? "SqlServer";

if (string.IsNullOrWhiteSpace(connectionString))
{
  throw new InvalidOperationException("Database connection string is not configured.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
  if (provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase) ||
      provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
  {
    options.UseNpgsql(connectionString);
  }
  else
  {
    options.UseSqlServer(connectionString);
  }
});

var allowedOrigins =
    builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
  options.AddPolicy("Frontend", policy =>
  {
    if (allowedOrigins.Length == 0 || allowedOrigins.Contains("*"))
    {
      policy.AllowAnyOrigin();
    }
    else
    {
      policy.WithOrigins(allowedOrigins);
    }

    policy.AllowAnyHeader()
          .AllowAnyMethod();
  });
});

var jwtKey =
    builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
      options.TokenValidationParameters = new TokenValidationParameters
      {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],

        IssuerSigningKey = new SymmetricSecurityKey(
              Encoding.UTF8.GetBytes(jwtKey)
          ),

        ClockSkew = TimeSpan.FromMinutes(1)
      };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IInsightService, InsightService>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();

// IMPORTANT FOR RENDER
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// DATABASE MIGRATION
//using (var scope = app.Services.CreateScope())
//{
//  var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

//  await db.Database.MigrateAsync();
//}

app.Run();

public partial class Program { }
