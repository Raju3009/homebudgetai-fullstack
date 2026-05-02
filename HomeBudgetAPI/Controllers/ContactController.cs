using HomeBudgetAPI.Data;
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
        public async Task<IActionResult> Submit([FromBody] ContactMessage contact)
        {
            if (string.IsNullOrWhiteSpace(contact.Name) ||
                string.IsNullOrWhiteSpace(contact.Email) ||
                string.IsNullOrWhiteSpace(contact.Message))
            {
                return BadRequest(new { message = "Name, email, and message are required" });
            }

            contact.Name = contact.Name.Trim();
            contact.Email = contact.Email.Trim();
            contact.Message = contact.Message.Trim();
            contact.CreatedAt = DateTime.UtcNow;

            _context.ContactMessages.Add(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Message received" });
        }
    }
}
