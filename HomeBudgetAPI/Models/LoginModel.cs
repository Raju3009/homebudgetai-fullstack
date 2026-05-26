using System.ComponentModel.DataAnnotations;

namespace HomeBudgetAPI.Models;

public record LoginModel([Required, EmailAddress] string Email, [Required] string Password);
