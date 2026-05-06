using Microsoft.EntityFrameworkCore;
using HomeBudgetAPI.Models;

namespace HomeBudgetAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<ContactMessage> ContactMessages { get; set; }
    }
}
