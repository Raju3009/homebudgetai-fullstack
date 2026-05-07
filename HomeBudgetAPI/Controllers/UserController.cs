using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace HomeBudgetAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,User")]
public class UserController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { message = "You are authorized." });
}
