using System.Security.Claims;
using System.Text;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Models;
using HomeBudgetAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeBudgetAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionRepository _transactions;

    public TransactionsController(ITransactionRepository transactions) => _transactions = transactions;

    [HttpGet]
    public Task<PagedResponse<TransactionResponse>> Search([FromQuery] string? q, [FromQuery] string? category, [FromQuery] TransactionType? type, [FromQuery] int page = 1, [FromQuery] int pageSize = 10) =>
        _transactions.SearchAsync(UserId, q, category, type, page, pageSize);

    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> Add(TransactionRequest request)
    {
        if (request.Amount <= 0) return BadRequest(new { message = "Amount must be greater than zero." });
        var item = await _transactions.AddAsync(new BudgetTransaction
        {
            Title = request.Title.Trim(),
            Category = request.Category.Trim(),
            Amount = request.Amount,
            Type = request.Type,
            Date = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc),
            Notes = request.Notes,
            UserId = UserId
        });
        return CreatedAtAction(nameof(Search), new { id = item.Id }, ToResponse(item));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransactionResponse>> Update(int id, TransactionRequest request)
    {
        var item = await _transactions.GetAsync(UserId, id);
        if (item is null) return NotFound();
        item.Title = request.Title.Trim();
        item.Category = request.Category.Trim();
        item.Amount = request.Amount;
        item.Type = request.Type;
        item.Date = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
        item.Notes = request.Notes;
        await _transactions.SaveAsync();
        return Ok(ToResponse(item));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _transactions.GetAsync(UserId, id);
        if (item is null) return NotFound();
        _transactions.Remove(item);
        await _transactions.SaveAsync();
        return NoContent();
    }

    [HttpGet("export")]
    public async Task<FileContentResult> Export()
    {
        var data = await _transactions.SearchAsync(UserId, null, null, null, 1, 100);
        var csv = new StringBuilder("Date,Type,Category,Title,Amount,Notes\n");
        foreach (var item in data.Items)
        {
            csv.AppendLine($"{item.Date:yyyy-MM-dd},{item.Type},{Escape(item.Category)},{Escape(item.Title)},{item.Amount},{Escape(item.Notes ?? string.Empty)}");
        }
        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "homebudget-transactions.csv");
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static TransactionResponse ToResponse(BudgetTransaction x) => new(x.Id, x.Title, x.Category, x.Amount, x.Type, x.Date, x.Notes);
    private static string Escape(string value) => $"\"{value.Replace("\"", "\"\"")}\"";
}
