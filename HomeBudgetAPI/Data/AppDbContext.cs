using HomeBudgetAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeBudgetAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<BudgetTransaction> Transactions => Set<BudgetTransaction>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserSetting> UserSettings => Set<UserSetting>();
    public DbSet<FinancialGoal> FinancialGoals => Set<FinancialGoal>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<BudgetTransaction>().Property(x => x.Amount).HasPrecision(18, 2);
        modelBuilder.Entity<BudgetTransaction>().HasIndex(x => new { x.UserId, x.Date });
        modelBuilder.Entity<BudgetTransaction>().HasIndex(x => new { x.UserId, x.Category });
        modelBuilder.Entity<BudgetTransaction>().HasOne(x => x.User).WithMany(x => x.Transactions).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Category>().HasIndex(x => new { x.UserId, x.Name }).IsUnique();
        modelBuilder.Entity<Category>().HasOne(x => x.User).WithMany(x => x.Categories).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Budget>().Property(x => x.LimitAmount).HasPrecision(18, 2);
        modelBuilder.Entity<Budget>().HasIndex(x => new { x.UserId, x.Month, x.Category });
        modelBuilder.Entity<Budget>().HasOne(x => x.User).WithMany(x => x.Budgets).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>().HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });
        modelBuilder.Entity<Notification>().HasOne(x => x.User).WithMany(x => x.Notifications).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserSetting>().HasIndex(x => x.UserId).IsUnique();
        modelBuilder.Entity<UserSetting>().HasOne(x => x.User).WithOne(x => x.Setting).HasForeignKey<UserSetting>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FinancialGoal>().Property(x => x.TargetAmount).HasPrecision(18, 2);
        modelBuilder.Entity<FinancialGoal>().Property(x => x.CurrentAmount).HasPrecision(18, 2);
        modelBuilder.Entity<FinancialGoal>().HasOne(x => x.User).WithMany(x => x.Goals).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RefreshToken>().HasIndex(x => x.TokenHash).IsUnique();
        modelBuilder.Entity<RefreshToken>().HasOne(x => x.User).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
