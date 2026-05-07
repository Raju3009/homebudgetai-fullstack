using HomeBudgetAPI.Data;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace HomeBudgetAPI.Repositories;

public interface ITransactionRepository
{
    Task<PagedResponse<TransactionResponse>> SearchAsync(int userId, string? query, string? category, TransactionType? type, int page, int pageSize);
    Task<List<BudgetTransaction>> ListForDashboardAsync(int userId);
    Task<BudgetTransaction?> GetAsync(int userId, int id);
    Task<BudgetTransaction> AddAsync(BudgetTransaction transaction);
    Task SaveAsync();
    void Remove(BudgetTransaction transaction);
}

public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _db;

    public TransactionRepository(AppDbContext db) => _db = db;

    public async Task<PagedResponse<TransactionResponse>> SearchAsync(int userId, string? query, string? category, TransactionType? type, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 5, 100);
        var items = _db.Transactions.AsNoTracking().Where(x => x.UserId == userId);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            items = items.Where(x => x.Title.ToLower().Contains(term) || x.Category.ToLower().Contains(term) || (x.Notes != null && x.Notes.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(category)) items = items.Where(x => x.Category == category);
        if (type.HasValue) items = items.Where(x => x.Type == type.Value);

        var total = await items.CountAsync();
        var data = await items.OrderByDescending(x => x.Date).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new TransactionResponse(x.Id, x.Title, x.Category, x.Amount, x.Type, x.Date, x.Notes))
            .ToListAsync();

        return new PagedResponse<TransactionResponse>(data, page, pageSize, total, (int)Math.Ceiling(total / (double)pageSize));
    }

    public Task<List<BudgetTransaction>> ListForDashboardAsync(int userId) =>
        _db.Transactions.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.Date).ToListAsync();

    public Task<BudgetTransaction?> GetAsync(int userId, int id) =>
        _db.Transactions.FirstOrDefaultAsync(x => x.UserId == userId && x.Id == id);

    public async Task<BudgetTransaction> AddAsync(BudgetTransaction transaction)
    {
        _db.Transactions.Add(transaction);
        await SaveAsync();
        return transaction;
    }

    public Task SaveAsync() => _db.SaveChangesAsync();

    public void Remove(BudgetTransaction transaction) => _db.Transactions.Remove(transaction);
}
