using HomeBudgetAPI.Data;
using HomeBudgetAPI.DTOs;
using HomeBudgetAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace HomeBudgetAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContactController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Submit(ContactRequest request)
        {
            var contact = new ContactMessage
            {
                Name = request.Name.Trim(),
                Email = request.Email.Trim().ToLowerInvariant(),
                Message = request.Message.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.ContactMessages.Add(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Message received" });
        }
    }
}
