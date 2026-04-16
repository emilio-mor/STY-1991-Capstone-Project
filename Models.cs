namespace OverdriveExchange.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string FullName { get; set; } = "";
        public string PasswordHash { get; set; } = "";
    }

    public class Favorite
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string CurrencyCode { get; set; } = "";
    }

    public class Alert
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string CurrencyPair { get; set; } = "";
        public decimal TargetRate { get; set; }
        public bool IsAbove { get; set; }
        public bool IsRead { get; set; }
    }

    // ViewModels
    public class LoginViewModel
    {
        public string EmailOrUsername { get; set; } = "";
        public string Password { get; set; } = "";
        public bool RememberMe { get; set; }
    }

    public class RegisterViewModel
    {
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Password { get; set; } = "";
        public string ConfirmPassword { get; set; } = "";
    }
}
