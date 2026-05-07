using HomeBudgetAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeBudgetAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ExpenseController : ControllerBase
{
    [HttpGet]
    public IActionResult CompatibilityNotice() => Ok(new PagedResponse<TransactionResponse>(Array.Empty<TransactionResponse>(), 1, 10, 0, 0));
}
