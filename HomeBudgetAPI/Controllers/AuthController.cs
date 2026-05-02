using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HomeBudgetAPI.Data;
using HomeBudgetAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace HomeBudgetAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] User user)
        {
            if (string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.Password))
                return BadRequest(new { message = "Email and password are required" });

            user.Email = user.Email.Trim();
            user.Password = user.Password.Trim();

            var exists = _context.Users
                .Any(u => u.Email.ToLower() == user.Email.ToLower());

            if (exists)
                return BadRequest(new { message = "User already exists" });

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { message = "Registered" });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Email and password are required" });

            var email = model.Email.Trim().ToLower();
            var password = model.Password.Trim();

            var user = _context.Users.FirstOrDefault(u =>
                u.Email.Trim().ToLower() == email &&
                u.Password.Trim() == password
            );

            if (user == null)
                return Unauthorized(new { message = "Invalid credentials" });

            var token = GenerateToken(user.Email);

            return Ok(new { token, email = user.Email });
        }

        [HttpPost("forgot")]
        public IActionResult Forgot([FromBody] LoginModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(new { message = "Email is required" });

            return Ok(new
            {
                message = "If this email exists, password reset instructions will be sent."
            });
        }

        private string GenerateToken(string email)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
