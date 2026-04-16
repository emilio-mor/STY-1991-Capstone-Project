using System.ComponentModel.DataAnnotations;

namespace OverdriveExchange.Models;

// ── Users ─────────────────────────────────────────────────────────────────────

public class User
{
    public int       Id           { get; set; }
    [MaxLength(60)]  public string Username     { get; set; } = "";
    [MaxLength(120)] public string Email        { get; set; } = "";
    [MaxLength(120)] public string FullName     { get; set; } = "";
    public string    PasswordHash { get; set; } = "";
    public DateTime  CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime? LastLogin    { get; set; }
    public List<FavoriteCurrency> Favorites { get; set; } = new();
    public List<RateAlert>        Alerts    { get; set; } = new();
}

public class LoginModel
{
    [Required] public string EmailOrUsername { get; set; } = "";
    [Required, DataType(DataType.Password)] public string Password { get; set; } = "";
    public bool RememberMe { get; set; }
}

public class RegisterModel
{
    [Required, MaxLength(120)] public string FullName { get; set; } = "";
    [Required, MinLength(3), MaxLength(60)] public string Username { get; set; } = "";
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required, MinLength(6), DataType(DataType.Password)] public string Password { get; set; } = "";
    [Required, Compare("Password"), DataType(DataType.Password)] public string ConfirmPassword { get; set; } = "";
}

// ── Currencies ────────────────────────────────────────────────────────────────

public record CurrencyInfo(string Code, string Name, string Flag, string Symbol);

public class ForexRate
{
    public string       BaseCurrency   { get; set; } = "";
    public string       TargetCurrency { get; set; } = "";
    public string       TargetName     { get; set; } = "";
    public string       BaseFlag       { get; set; } = "";
    public string       TargetFlag     { get; set; } = "";
    public double       Rate           { get; set; }
    public double       ChangePercent  { get; set; }
    public List<double> SparkData      { get; set; } = new();
}

public class CryptoRate
{
    public string Symbol            { get; set; } = "";
    public string Name              { get; set; } = "";
    public string CoinGeckoId       { get; set; } = "";
    public double PriceUsd          { get; set; }
    public double ChangePercent24h  { get; set; }
    public double MarketCapBillions { get; set; }
    public double Volume24hBillions { get; set; }
    public string Icon              { get; set; } = "";
    public string Color             { get; set; } = "";
    public string ImageUrl          { get; set; } = "";
}

public class ConversionResult
{
    public string   FromCode { get; set; } = "";
    public string   ToCode   { get; set; } = "";
    public string   FromName { get; set; } = "";
    public string   ToName   { get; set; } = "";
    public string   FromFlag { get; set; } = "";
    public string   ToFlag   { get; set; } = "";
    public double   Amount   { get; set; }
    public double   Result   { get; set; }
    public double   Rate     { get; set; }
    public double   Inverse  { get; set; }
    public DateTime At       { get; set; } = DateTime.UtcNow;
}

public class TrendPoint  { public string Label { get; set; } = ""; public double Rate { get; set; } }

public class TrendResult
{
    public string           Pair          { get; set; } = "";
    public string           BaseName      { get; set; } = "";
    public string           TargetName    { get; set; } = "";
    public string           BaseFlag      { get; set; } = "";
    public string           TargetFlag    { get; set; } = "";
    public double           CurrentRate   { get; set; }
    public double           ChangePercent { get; set; }
    public double           High          { get; set; }
    public double           Low           { get; set; }
    public List<TrendPoint> History       { get; set; } = new();
}

// ── Favorites ─────────────────────────────────────────────────────────────────

public class FavoriteCurrency
{
    public int      Id           { get; set; }
    public int      UserId       { get; set; }
    public User?    User         { get; set; }
    [MaxLength(10)]  public string CurrencyCode { get; set; } = "";
    [MaxLength(100)] public string CurrencyName { get; set; } = "";
    [MaxLength(10)]  public string Flag         { get; set; } = "";
    public DateTime AddedAt      { get; set; } = DateTime.UtcNow;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

public class RateAlert
{
    public int    Id             { get; set; }
    public int    UserId         { get; set; }
    public User?  User           { get; set; }
    [MaxLength(10)] public string BaseCurrency   { get; set; } = "";
    [MaxLength(10)] public string TargetCurrency { get; set; } = "";
    public double   TargetRate   { get; set; }
    public AlertCondition Condition { get; set; }
    public bool   IsActive       { get; set; } = true;
    public bool   IsTriggered    { get; set; }
    public DateTime  CreatedAt   { get; set; } = DateTime.UtcNow;
    public DateTime? TriggeredAt { get; set; }
}

public enum AlertCondition { Above, Below }

public class NotificationLog
{
    public int      Id        { get; set; }
    public int      UserId    { get; set; }
    public string   Message   { get; set; } = "";
    public string   Pair      { get; set; } = "";
    public bool     IsRead    { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CreateAlertModel
{
    [Required] public string BaseCurrency   { get; set; } = "USD";
    [Required] public string TargetCurrency { get; set; } = "EUR";
    [Required, Range(0.00001, 10_000_000)] public double TargetRate { get; set; }
    [Required] public AlertCondition Condition { get; set; }
}
