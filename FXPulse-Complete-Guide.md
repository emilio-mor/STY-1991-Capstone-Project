# FXPulse — Complete Project Code & Setup Guide

> A full-stack Exchange Rate Web App built with **C# ASP.NET Core 8 MVC** (backend) and a **React** standalone web interface.

---

## Table of Contents

1. [Project Overview](#overview)
2. [Quick Start](#quickstart)
3. [Project Structure](#structure)
4. [Part A: C# ASP.NET Core Backend](#partA)
   - [ExchangeRateApp.csproj](#csproj)
   - [Program.cs](#program)
   - [appsettings.json](#appsettings)
   - [Models/Models.cs](#models)
   - [Models/Extensions.cs](#extensions)
   - [Data/AppDbContext.cs](#dbcontext)
   - [Services/ExchangeRateService.cs](#rateservice)
   - [Services/Services.cs](#services)
   - [Controllers/AccountController.cs](#accountctrl)
   - [Controllers/Controllers.cs](#controllers)
   - [Views/Shared/_Layout.cshtml](#layout)
   - [Views/Account/Login.cshtml](#login)
   - [Views/Account/Register.cshtml](#register)
   - [Views/Dashboard/Index.cshtml](#dashboard)
   - [Views/Converter/Index.cshtml](#converter)
   - [Views/Trends/Index.cshtml](#trends)
   - [Views/Favorites/Index.cshtml](#favorites)
   - [Views/Notifications/Index.cshtml](#notifications)
   - [Views/_ViewImports.cshtml](#viewimports)
   - [Views/_ViewStart.cshtml](#viewstart)
   - [Views/Shared/Error.cshtml](#error)
   - [wwwroot/css/site.css](#css)
   - [wwwroot/lib/signalr/signalr.min.js](#signalr)
5. [Part B: React Standalone Web App](#partB)
   - [FXPulse.jsx](#jsx)
   - [index.html](#html)
6. [How to Run](#howtorun)
7. [Features Guide](#features)
8. [Connecting to Live APIs](#liveapis)

---

## 1. Project Overview {#overview}

FXPulse is a full-featured exchange rate application with:

| Feature | Details |
|---|---|
| 🔐 Authentication | Register/Login with BCrypt passwords, cookie sessions |
| 📊 Dashboard | Top 5 Forex pairs + Top 5 Cryptos vs USD with sparklines |
| 💱 Converter | Convert between 53+ world currencies (e.g. BRL → HNL) |
| 📈 Trends | Interactive charts with 7/14/30/60/90-day history |
| ★ Favorites | Pin currencies for quick dashboard access |
| 🔔 Alerts | Set rate threshold alerts with real-time SignalR push |

**Tech Stack:**
- Backend: C# ASP.NET Core 8, Entity Framework Core, SQLite, SignalR, BCrypt
- Frontend (standalone): React 18, Recharts, Google Fonts
- Design: Dark terminal aesthetic, DM Mono + Outfit fonts

---

## 2. Quick Start {#quickstart}

### Option A — Run the C# Backend

```bash
# Prerequisites: .NET 8 SDK (https://dotnet.microsoft.com/download)

# 1. Create the project folder and files (copy all files from Part A below)
mkdir ExchangeRateApp && cd ExchangeRateApp

# 2. Restore packages
dotnet restore

# 3. Run (SQLite DB is auto-created on first run)
dotnet run

# 4. Open browser
# → http://localhost:5000
# Demo login: demo / demo123
```

### Option B — Open the React Standalone (no install needed)

```
1. Save index.html and FXPulse.jsx from Part B
2. Open index.html in any modern browser
3. Login: demo / demo123  (or register a new account)
```

---

## 3. Project Structure {#structure}

```
ExchangeRateApp/                    ← C# Backend
├── ExchangeRateApp.csproj
├── Program.cs
├── appsettings.json
├── Controllers/
│   ├── AccountController.cs        ← Login, Register, Logout
│   └── Controllers.cs              ← Dashboard, Converter, Trends, Favorites, Notifications
├── Data/
│   └── AppDbContext.cs             ← EF Core DbContext + Seeder
├── Models/
│   ├── Models.cs                   ← All domain models & ViewModels
│   └── Extensions.cs              ← Crypto color helper
├── Services/
│   ├── ExchangeRateService.cs      ← 53 currencies, rate calculations
│   └── Services.cs                 ← UserService, NotificationService, SignalR Hub, Background monitor
├── Views/
│   ├── _ViewImports.cshtml
│   ├── _ViewStart.cshtml
│   ├── Shared/
│   │   ├── _Layout.cshtml          ← Main shell with sidebar nav
│   │   └── Error.cshtml
│   ├── Account/
│   │   ├── Login.cshtml
│   │   └── Register.cshtml
│   ├── Dashboard/Index.cshtml
│   ├── Converter/Index.cshtml
│   ├── Trends/Index.cshtml
│   ├── Favorites/Index.cshtml
│   └── Notifications/Index.cshtml
└── wwwroot/
    ├── css/site.css                ← Full dark theme design system
    └── lib/signalr/signalr.min.js  ← SignalR client stub

standalone/                         ← React Web App (no server needed)
├── index.html
└── FXPulse.jsx
```

---

## 4. Part A: C# ASP.NET Core Backend {#partA}

---

### ExchangeRateApp.csproj {#csproj}

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>ExchangeRateApp</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.Cookies" Version="8.0.0" />
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>

</Project>
```

---

### Program.cs {#program}

```csharp
using ExchangeRateApp.Data;
using ExchangeRateApp.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllersWithViews();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=exchangerates.db"));

builder.Services.AddAuthentication("CookieAuth")
    .AddCookie("CookieAuth", options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/Login";
        options.Cookie.Name = "ExchangeRateApp.Auth";
        options.Cookie.HttpOnly = true;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
    });

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.AddHttpClient();
builder.Services.AddScoped<IExchangeRateService, ExchangeRateService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddHostedService<RateMonitorService>();
builder.Services.AddSignalR();

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseSession();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}/{id?}");

app.MapHub<NotificationHub>("/notificationHub");

app.Run();
```

---

### appsettings.json {#appsettings}

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=exchangerates.db"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ExchangeRateApi": {
    "BaseUrl": "https://api.exchangerate-api.com/v4/latest/",
    "CryptoUrl": "https://api.coingecko.com/api/v3/",
    "UseMockData": true
  }
}
```

---

### Models/Models.cs {#models}

```csharp
using System.ComponentModel.DataAnnotations;

namespace ExchangeRateApp.Models;

// ─── Auth & User ─────────────────────────────────────────────────────────────

public class User
{
    public int Id { get; set; }
    [Required, MaxLength(50)] public string Username { get; set; } = "";
    [Required, MaxLength(100)] public string Email { get; set; } = "";
    [Required] public string PasswordHash { get; set; } = "";
    [MaxLength(100)] public string FullName { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLogin { get; set; }
    public ICollection<FavoriteCurrency> FavoriteCurrencies { get; set; } = new List<FavoriteCurrency>();
    public ICollection<NotificationAlert> NotificationAlerts { get; set; } = new List<NotificationAlert>();
}

public class RegisterViewModel
{
    [Required(ErrorMessage = "Username is required")]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(50)]
    public string Username { get; set; } = "";

    [Required(ErrorMessage = "Full name is required")]
    [MaxLength(100)]
    public string FullName { get; set; } = "";

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = "";

    [Required(ErrorMessage = "Please confirm your password")]
    [DataType(DataType.Password)]
    [Compare("Password", ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = "";
}

public class LoginViewModel
{
    [Required(ErrorMessage = "Email or username is required")]
    public string EmailOrUsername { get; set; } = "";

    [Required(ErrorMessage = "Password is required")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = "";

    public bool RememberMe { get; set; }
}

// ─── Exchange Rate ────────────────────────────────────────────────────────────

public class ExchangeRatePair
{
    public string BaseCurrency { get; set; } = "";
    public string TargetCurrency { get; set; } = "";
    public double Rate { get; set; }
    public double ChangePercent { get; set; }
    public double ChangeValue { get; set; }
    public string BaseName { get; set; } = "";
    public string TargetName { get; set; } = "";
    public string BaseFlag { get; set; } = "";
    public string TargetFlag { get; set; } = "";
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class CryptoRate
{
    public string Symbol { get; set; } = "";
    public string Name { get; set; } = "";
    public double PriceUsd { get; set; }
    public double ChangePercent24h { get; set; }
    public double MarketCap { get; set; }
    public double Volume24h { get; set; }
    public string Icon { get; set; } = "";
    public string Color { get; set; } = "";
}

public class ConversionResult
{
    public string FromCurrency { get; set; } = "";
    public string ToCurrency { get; set; } = "";
    public string FromName { get; set; } = "";
    public string ToName { get; set; } = "";
    public string FromFlag { get; set; } = "";
    public string ToFlag { get; set; } = "";
    public double Amount { get; set; }
    public double Result { get; set; }
    public double Rate { get; set; }
    public double InverseRate { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class ConverterViewModel
{
    public List<CurrencyInfo> AllCurrencies { get; set; } = new();
    public ConversionResult? Result { get; set; }
    public string FromCurrency { get; set; } = "USD";
    public string ToCurrency { get; set; } = "EUR";
    public double Amount { get; set; } = 1;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

public class FavoriteCurrency
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    [MaxLength(10)] public string CurrencyCode { get; set; } = "";
    [MaxLength(100)] public string CurrencyName { get; set; } = "";
    [MaxLength(10)] public string Flag { get; set; } = "";
    public bool IsCrypto { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}

// ─── Notifications ───────────────────────────────────────────────────────────

public class NotificationAlert
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    [MaxLength(10)] public string BaseCurrency { get; set; } = "";
    [MaxLength(10)] public string TargetCurrency { get; set; } = "";
    public double TargetRate { get; set; }
    public AlertCondition Condition { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsTriggered { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? TriggeredAt { get; set; }
}

public enum AlertCondition { Above, Below }

public class NotificationLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Message { get; set; } = "";
    public string CurrencyPair { get; set; } = "";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CreateAlertViewModel
{
    [Required] public string BaseCurrency { get; set; } = "USD";
    [Required] public string TargetCurrency { get; set; } = "EUR";
    [Required, Range(0.0001, 10000000)] public double TargetRate { get; set; }
    [Required] public AlertCondition Condition { get; set; }
}

// ─── Trends ──────────────────────────────────────────────────────────────────

public class RateSnapshot
{
    public int Id { get; set; }
    [MaxLength(10)] public string BaseCurrency { get; set; } = "";
    [MaxLength(10)] public string TargetCurrency { get; set; } = "";
    public double Rate { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class TrendData
{
    public string Pair { get; set; } = "";
    public string BaseName { get; set; } = "";
    public string TargetName { get; set; } = "";
    public string BaseFlag { get; set; } = "";
    public string TargetFlag { get; set; } = "";
    public double CurrentRate { get; set; }
    public double ChangePercent { get; set; }
    public double High { get; set; }
    public double Low { get; set; }
    public List<RatePoint> History { get; set; } = new();
}

public class RatePoint
{
    public DateTime Date { get; set; }
    public double Rate { get; set; }
}

// ─── Currency Info ────────────────────────────────────────────────────────────

public class CurrencyInfo
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Flag { get; set; } = "";
    public string Symbol { get; set; } = "";
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

public class DashboardViewModel
{
    public List<ExchangeRatePair> TopForex { get; set; } = new();
    public List<CryptoRate> TopCrypto { get; set; } = new();
    public List<FavoriteCurrency> Favorites { get; set; } = new();
    public int UnreadNotifications { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class NotificationsViewModel
{
    public List<NotificationAlert> Alerts { get; set; } = new();
    public List<NotificationLog> Logs { get; set; } = new();
    public List<CurrencyInfo> AllCurrencies { get; set; } = new();
    public CreateAlertViewModel NewAlert { get; set; } = new();
    public int UnreadCount { get; set; }
}
```

---

### Models/Extensions.cs {#extensions}

```csharp
namespace ExchangeRateApp.Models;

public static class CryptoRateExtensions
{
    public static string Color20(this CryptoRate c) =>
        c.Color.Length == 7 ? c.Color + "33" : c.Color;
}
```

---

### Data/AppDbContext.cs {#dbcontext}

```csharp
using ExchangeRateApp.Models;
using Microsoft.EntityFrameworkCore;

namespace ExchangeRateApp.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<FavoriteCurrency> FavoriteCurrencies { get; set; }
    public DbSet<NotificationAlert> NotificationAlerts { get; set; }
    public DbSet<NotificationLog> NotificationLogs { get; set; }
    public DbSet<RateSnapshot> RateSnapshots { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
        });

        modelBuilder.Entity<FavoriteCurrency>(e =>
        {
            e.HasKey(f => f.Id);
            e.HasOne(f => f.User).WithMany(u => u.FavoriteCurrencies).HasForeignKey(f => f.UserId);
            e.HasIndex(f => new { f.UserId, f.CurrencyCode }).IsUnique();
        });

        modelBuilder.Entity<NotificationAlert>(e =>
        {
            e.HasKey(n => n.Id);
            e.HasOne(n => n.User).WithMany(u => u.NotificationAlerts).HasForeignKey(n => n.UserId);
        });

        modelBuilder.Entity<NotificationLog>(e =>
        {
            e.HasKey(n => n.Id);
            e.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId);
        });

        modelBuilder.Entity<RateSnapshot>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.BaseCurrency, r.TargetCurrency, r.Timestamp });
        });
    }
}

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (!db.Users.Any())
        {
            db.Users.Add(new User
            {
                Username = "demo",
                Email = "demo@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("demo123"),
                CreatedAt = DateTime.UtcNow,
                FullName = "Demo User"
            });
            db.SaveChanges();
        }

        if (!db.RateSnapshots.Any())
        {
            var pairs = new[] { ("USD","EUR"),("USD","GBP"),("USD","JPY"),("USD","CAD"),("USD","AUD") };
            var baseRates = new Dictionary<string, double> {
                {"EUR",0.9221},{"GBP",0.7912},{"JPY",149.72},{"CAD",1.3621},{"AUD",1.5330}
            };
            var rng = new Random(42);
            foreach (var (b, t) in pairs)
            {
                var baseRate = baseRates[t];
                for (int i = 30; i >= 0; i--)
                {
                    db.RateSnapshots.Add(new RateSnapshot
                    {
                        BaseCurrency = b,
                        TargetCurrency = t,
                        Rate = baseRate + (rng.NextDouble() - 0.5) * baseRate * 0.02,
                        Timestamp = DateTime.UtcNow.AddDays(-i)
                    });
                }
            }
            db.SaveChanges();
        }
    }
}
```

---

### Services/ExchangeRateService.cs {#rateservice}

```csharp
using ExchangeRateApp.Models;

namespace ExchangeRateApp.Services;

public interface IExchangeRateService
{
    Task<List<ExchangeRatePair>> GetTopForexRatesAsync();
    Task<List<CryptoRate>> GetTopCryptoRatesAsync();
    Task<ConversionResult?> ConvertAsync(string from, string to, double amount);
    Task<TrendData?> GetTrendDataAsync(string base_, string target, int days = 30);
    List<CurrencyInfo> GetAllCurrencies();
    Task<double> GetRateAsync(string from, string to);
}

public class ExchangeRateService : IExchangeRateService
{
    private static readonly List<CurrencyInfo> _currencies = new()
    {
        new() { Code="USD", Name="US Dollar",          Symbol="$",    Flag="🇺🇸" },
        new() { Code="EUR", Name="Euro",               Symbol="€",    Flag="🇪🇺" },
        new() { Code="GBP", Name="British Pound",      Symbol="£",    Flag="🇬🇧" },
        new() { Code="JPY", Name="Japanese Yen",       Symbol="¥",    Flag="🇯🇵" },
        new() { Code="CAD", Name="Canadian Dollar",    Symbol="CA$",  Flag="🇨🇦" },
        new() { Code="AUD", Name="Australian Dollar",  Symbol="A$",   Flag="🇦🇺" },
        new() { Code="CHF", Name="Swiss Franc",        Symbol="Fr",   Flag="🇨🇭" },
        new() { Code="CNY", Name="Chinese Yuan",       Symbol="¥",    Flag="🇨🇳" },
        new() { Code="BRL", Name="Brazilian Real",     Symbol="R$",   Flag="🇧🇷" },
        new() { Code="MXN", Name="Mexican Peso",       Symbol="$",    Flag="🇲🇽" },
        new() { Code="INR", Name="Indian Rupee",       Symbol="₹",    Flag="🇮🇳" },
        new() { Code="KRW", Name="South Korean Won",   Symbol="₩",    Flag="🇰🇷" },
        new() { Code="SGD", Name="Singapore Dollar",   Symbol="S$",   Flag="🇸🇬" },
        new() { Code="HKD", Name="Hong Kong Dollar",   Symbol="HK$",  Flag="🇭🇰" },
        new() { Code="SEK", Name="Swedish Krona",      Symbol="kr",   Flag="🇸🇪" },
        new() { Code="NOK", Name="Norwegian Krone",    Symbol="kr",   Flag="🇳🇴" },
        new() { Code="DKK", Name="Danish Krone",       Symbol="kr",   Flag="🇩🇰" },
        new() { Code="NZD", Name="New Zealand Dollar", Symbol="NZ$",  Flag="🇳🇿" },
        new() { Code="ZAR", Name="South African Rand", Symbol="R",    Flag="🇿🇦" },
        new() { Code="ARS", Name="Argentine Peso",     Symbol="$",    Flag="🇦🇷" },
        new() { Code="CLP", Name="Chilean Peso",       Symbol="$",    Flag="🇨🇱" },
        new() { Code="COP", Name="Colombian Peso",     Symbol="$",    Flag="🇨🇴" },
        new() { Code="PEN", Name="Peruvian Sol",       Symbol="S/.",  Flag="🇵🇪" },
        new() { Code="HNL", Name="Honduran Lempira",   Symbol="L",    Flag="🇭🇳" },
        new() { Code="GTQ", Name="Guatemalan Quetzal", Symbol="Q",    Flag="🇬🇹" },
        new() { Code="CRC", Name="Costa Rican Colón",  Symbol="₡",    Flag="🇨🇷" },
        new() { Code="DOP", Name="Dominican Peso",     Symbol="RD$",  Flag="🇩🇴" },
        new() { Code="TRY", Name="Turkish Lira",       Symbol="₺",    Flag="🇹🇷" },
        new() { Code="RUB", Name="Russian Ruble",      Symbol="₽",    Flag="🇷🇺" },
        new() { Code="THB", Name="Thai Baht",          Symbol="฿",    Flag="🇹🇭" },
        new() { Code="IDR", Name="Indonesian Rupiah",  Symbol="Rp",   Flag="🇮🇩" },
        new() { Code="MYR", Name="Malaysian Ringgit",  Symbol="RM",   Flag="🇲🇾" },
        new() { Code="PHP", Name="Philippine Peso",    Symbol="₱",    Flag="🇵🇭" },
        new() { Code="VND", Name="Vietnamese Dong",    Symbol="₫",    Flag="🇻🇳" },
        new() { Code="EGP", Name="Egyptian Pound",     Symbol="£",    Flag="🇪🇬" },
        new() { Code="NGN", Name="Nigerian Naira",     Symbol="₦",    Flag="🇳🇬" },
        new() { Code="KES", Name="Kenyan Shilling",    Symbol="KSh",  Flag="🇰🇪" },
        new() { Code="GHS", Name="Ghanaian Cedi",      Symbol="₵",    Flag="🇬🇭" },
        new() { Code="AED", Name="UAE Dirham",         Symbol="د.إ",  Flag="🇦🇪" },
        new() { Code="SAR", Name="Saudi Riyal",        Symbol="﷼",    Flag="🇸🇦" },
        new() { Code="ILS", Name="Israeli Shekel",     Symbol="₪",    Flag="🇮🇱" },
        new() { Code="QAR", Name="Qatari Riyal",       Symbol="﷼",    Flag="🇶🇦" },
        new() { Code="PKR", Name="Pakistani Rupee",    Symbol="₨",    Flag="🇵🇰" },
        new() { Code="BDT", Name="Bangladeshi Taka",   Symbol="৳",    Flag="🇧🇩" },
        new() { Code="UAH", Name="Ukrainian Hryvnia",  Symbol="₴",    Flag="🇺🇦" },
        new() { Code="RON", Name="Romanian Leu",       Symbol="lei",  Flag="🇷🇴" },
        new() { Code="HUF", Name="Hungarian Forint",   Symbol="Ft",   Flag="🇭🇺" },
        new() { Code="CZK", Name="Czech Koruna",       Symbol="Kč",   Flag="🇨🇿" },
        new() { Code="PLN", Name="Polish Zloty",       Symbol="zł",   Flag="🇵🇱" },
        new() { Code="TWD", Name="Taiwanese Dollar",   Symbol="NT$",  Flag="🇹🇼" },
        new() { Code="MAD", Name="Moroccan Dirham",    Symbol="MAD",  Flag="🇲🇦" },
        new() { Code="JOD", Name="Jordanian Dinar",    Symbol="JD",   Flag="🇯🇴" },
        new() { Code="KWD", Name="Kuwaiti Dinar",      Symbol="KD",   Flag="🇰🇼" },
        new() { Code="OMR", Name="Omani Rial",         Symbol="﷼",    Flag="🇴🇲" },
    };

    private static readonly Dictionary<string, double> _ratesFromUsd = new()
    {
        {"USD",1},    {"EUR",0.9221}, {"GBP",0.7912}, {"JPY",149.72}, {"CAD",1.3621},
        {"AUD",1.533},{"CHF",0.8821}, {"CNY",7.2410}, {"BRL",4.9620}, {"MXN",17.124},
        {"INR",83.21},{"KRW",1321.5}, {"SGD",1.3421}, {"HKD",7.8210}, {"SEK",10.432},
        {"NOK",10.621},{"DKK",6.882}, {"NZD",1.643},  {"ZAR",18.921}, {"ARS",873.5},
        {"CLP",924.3}, {"COP",3952.4},{"PEN",3.762},  {"HNL",24.71},  {"GTQ",7.801},
        {"CRC",520.12},{"DOP",58.42}, {"TRY",32.15},  {"RUB",91.25},  {"THB",35.12},
        {"IDR",15721}, {"MYR",4.712}, {"PHP",56.32},  {"VND",24870},  {"EGP",48.12},
        {"NGN",1570.4},{"KES",129.4}, {"GHS",14.21},  {"AED",3.6725}, {"SAR",3.751},
        {"ILS",3.702}, {"QAR",3.641}, {"PKR",278.4},  {"BDT",110.12}, {"UAH",39.21},
        {"RON",4.582}, {"HUF",357.1}, {"CZK",23.12},  {"PLN",4.012},  {"TWD",32.45},
        {"MAD",10.021},{"JOD",0.7092},{"KWD",0.3069}, {"OMR",0.385},
    };

    private static readonly Dictionary<string, (double change, string flag)> _forexMeta = new()
    {
        {"EUR",(+0.23,"🇪🇺")}, {"GBP",(-0.14,"🇬🇧")}, {"JPY",(+0.41,"🇯🇵")},
        {"CAD",(-0.07,"🇨🇦")}, {"AUD",(+0.18,"🇦🇺")},
    };

    public List<CurrencyInfo> GetAllCurrencies() => _currencies;

    public Task<double> GetRateAsync(string from, string to)
    {
        var fromRate = _ratesFromUsd.GetValueOrDefault(from.ToUpper(), 1);
        var toRate   = _ratesFromUsd.GetValueOrDefault(to.ToUpper(), 1);
        return Task.FromResult(toRate / fromRate);
    }

    public async Task<List<ExchangeRatePair>> GetTopForexRatesAsync()
    {
        var pairs = new List<ExchangeRatePair>();
        foreach (var (code, (change, flag)) in _forexMeta)
        {
            var rate  = await GetRateAsync("USD", code);
            var cInfo = _currencies.FirstOrDefault(c => c.Code == code);
            pairs.Add(new ExchangeRatePair
            {
                BaseCurrency  = "USD", TargetCurrency = code,
                Rate          = Math.Round(rate, 4),
                ChangePercent = change, ChangeValue = Math.Round(rate * change / 100, 4),
                BaseName      = "US Dollar", TargetName = cInfo?.Name ?? code,
                BaseFlag      = "🇺🇸", TargetFlag = flag,
                LastUpdated   = DateTime.UtcNow
            });
        }
        return pairs;
    }

    public Task<List<CryptoRate>> GetTopCryptoRatesAsync()
    {
        return Task.FromResult(new List<CryptoRate>
        {
            new(){Symbol="BTC",Name="Bitcoin",  PriceUsd=67420.50,ChangePercent24h=+2.14,MarketCap=1_320_000_000_000,Volume24h=28_500_000_000,Icon="₿",Color="#F7931A"},
            new(){Symbol="ETH",Name="Ethereum", PriceUsd=3521.80, ChangePercent24h=+3.41,MarketCap=423_000_000_000,  Volume24h=14_200_000_000,Icon="Ξ",Color="#627EEA"},
            new(){Symbol="BNB",Name="BNB",      PriceUsd=598.30,  ChangePercent24h=+1.22,MarketCap=87_500_000_000,   Volume24h=1_900_000_000, Icon="⬡",Color="#F3BA2F"},
            new(){Symbol="SOL",Name="Solana",   PriceUsd=182.40,  ChangePercent24h=+5.67,MarketCap=81_200_000_000,   Volume24h=3_800_000_000, Icon="◎",Color="#9945FF"},
            new(){Symbol="XRP",Name="XRP",      PriceUsd=0.5921,  ChangePercent24h=+0.89,MarketCap=33_400_000_000,   Volume24h=1_200_000_000, Icon="✕",Color="#346AA9"},
        });
    }

    public async Task<ConversionResult?> ConvertAsync(string from, string to, double amount)
    {
        from = from.ToUpper(); to = to.ToUpper();
        var rate    = await GetRateAsync(from, to);
        var fromInfo = _currencies.FirstOrDefault(c => c.Code == from);
        var toInfo   = _currencies.FirstOrDefault(c => c.Code == to);
        return new ConversionResult
        {
            FromCurrency = from, ToCurrency   = to,
            FromName     = fromInfo?.Name ?? from, ToName = toInfo?.Name ?? to,
            FromFlag     = fromInfo?.Flag ?? "🏳",  ToFlag = toInfo?.Flag ?? "🏳",
            Amount       = amount, Result      = Math.Round(amount * rate, 6),
            Rate         = Math.Round(rate, 6), InverseRate = Math.Round(1 / rate, 6),
            Timestamp    = DateTime.UtcNow
        };
    }

    public Task<TrendData?> GetTrendDataAsync(string base_, string target, int days = 30)
    {
        var b = base_.ToUpper(); var t = target.ToUpper();
        var baseInfo   = _currencies.FirstOrDefault(c => c.Code == b);
        var targetInfo = _currencies.FirstOrDefault(c => c.Code == t);
        var fromRate   = _ratesFromUsd.GetValueOrDefault(b, 1);
        var toRate     = _ratesFromUsd.GetValueOrDefault(t, 1);
        var currentRate = toRate / fromRate;

        var rng     = new Random(b.GetHashCode() ^ t.GetHashCode());
        var history = new List<RatePoint>();
        var rate    = currentRate * (1 + (rng.NextDouble() - 0.5) * 0.05);
        for (int i = days; i >= 0; i--)
        {
            rate += (rng.NextDouble() - 0.5) * currentRate * 0.01;
            history.Add(new RatePoint { Date = DateTime.UtcNow.AddDays(-i), Rate = Math.Round(rate, 6) });
        }

        var firstRate      = history.First().Rate;
        var changePercent  = (currentRate - firstRate) / firstRate * 100;

        return Task.FromResult<TrendData?>(new TrendData
        {
            Pair          = $"{b}/{t}",
            BaseName      = baseInfo?.Name   ?? b, TargetName  = targetInfo?.Name  ?? t,
            BaseFlag      = baseInfo?.Flag   ?? "🏳", TargetFlag = targetInfo?.Flag ?? "🏳",
            CurrentRate   = Math.Round(currentRate, 6),
            ChangePercent = Math.Round(changePercent, 2),
            High          = history.Max(h => h.Rate),
            Low           = history.Min(h => h.Rate),
            History       = history
        });
    }
}
```

---

### Services/Services.cs {#services}

```csharp
using ExchangeRateApp.Data;
using ExchangeRateApp.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ExchangeRateApp.Services;

// ─── User Service ─────────────────────────────────────────────────────────────

public interface IUserService
{
    Task<User?> AuthenticateAsync(string emailOrUsername, string password);
    Task<(bool success, string error)> RegisterAsync(RegisterViewModel model);
    Task<User?> GetByIdAsync(int id);
    Task UpdateLastLoginAsync(int userId);
}

public class UserService : IUserService
{
    private readonly AppDbContext _db;
    public UserService(AppDbContext db) { _db = db; }

    public async Task<User?> AuthenticateAsync(string emailOrUsername, string password)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == emailOrUsername || u.Username == emailOrUsername);
        if (user == null) return null;
        return BCrypt.Net.BCrypt.Verify(password, user.PasswordHash) ? user : null;
    }

    public async Task<(bool success, string error)> RegisterAsync(RegisterViewModel model)
    {
        if (await _db.Users.AnyAsync(u => u.Email == model.Email))
            return (false, "An account with this email already exists.");
        if (await _db.Users.AnyAsync(u => u.Username == model.Username))
            return (false, "Username is already taken.");

        _db.Users.Add(new User
        {
            Username     = model.Username, Email    = model.Email,
            FullName     = model.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
            CreatedAt    = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return (true, "");
    }

    public Task<User?> GetByIdAsync(int id) =>
        _db.Users
            .Include(u => u.FavoriteCurrencies)
            .Include(u => u.NotificationAlerts)
            .FirstOrDefaultAsync(u => u.Id == id);

    public async Task UpdateLastLoginAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user != null) { user.LastLogin = DateTime.UtcNow; await _db.SaveChangesAsync(); }
    }
}

// ─── Notification Service ─────────────────────────────────────────────────────

public interface INotificationService
{
    Task<List<NotificationAlert>> GetAlertsAsync(int userId);
    Task<List<NotificationLog>> GetLogsAsync(int userId);
    Task<bool> CreateAlertAsync(int userId, CreateAlertViewModel model);
    Task DeleteAlertAsync(int userId, int alertId);
    Task MarkLogsReadAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task AddFavoriteAsync(int userId, string code, string name, string flag, bool isCrypto);
    Task RemoveFavoriteAsync(int userId, string code);
    Task<List<FavoriteCurrency>> GetFavoritesAsync(int userId);
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    public NotificationService(AppDbContext db) { _db = db; }

    public Task<List<NotificationAlert>> GetAlertsAsync(int userId) =>
        _db.NotificationAlerts.Where(a => a.UserId == userId).OrderByDescending(a => a.CreatedAt).ToListAsync();

    public Task<List<NotificationLog>> GetLogsAsync(int userId) =>
        _db.NotificationLogs.Where(l => l.UserId == userId).OrderByDescending(l => l.CreatedAt).Take(50).ToListAsync();

    public async Task<bool> CreateAlertAsync(int userId, CreateAlertViewModel model)
    {
        _db.NotificationAlerts.Add(new NotificationAlert
        {
            UserId         = userId,
            BaseCurrency   = model.BaseCurrency.ToUpper(),
            TargetCurrency = model.TargetCurrency.ToUpper(),
            TargetRate     = model.TargetRate,
            Condition      = model.Condition,
            IsActive       = true,
            CreatedAt      = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task DeleteAlertAsync(int userId, int alertId)
    {
        var alert = await _db.NotificationAlerts.FirstOrDefaultAsync(a => a.Id == alertId && a.UserId == userId);
        if (alert != null) { _db.NotificationAlerts.Remove(alert); await _db.SaveChangesAsync(); }
    }

    public async Task MarkLogsReadAsync(int userId)
    {
        var logs = await _db.NotificationLogs.Where(l => l.UserId == userId && !l.IsRead).ToListAsync();
        logs.ForEach(l => l.IsRead = true);
        await _db.SaveChangesAsync();
    }

    public Task<int> GetUnreadCountAsync(int userId) =>
        _db.NotificationLogs.CountAsync(l => l.UserId == userId && !l.IsRead);

    public async Task AddFavoriteAsync(int userId, string code, string name, string flag, bool isCrypto)
    {
        if (!await _db.FavoriteCurrencies.AnyAsync(f => f.UserId == userId && f.CurrencyCode == code))
        {
            _db.FavoriteCurrencies.Add(new FavoriteCurrency
            {
                UserId = userId, CurrencyCode = code, CurrencyName = name,
                Flag   = flag, IsCrypto = isCrypto, AddedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }
    }

    public async Task RemoveFavoriteAsync(int userId, string code)
    {
        var fav = await _db.FavoriteCurrencies.FirstOrDefaultAsync(f => f.UserId == userId && f.CurrencyCode == code);
        if (fav != null) { _db.FavoriteCurrencies.Remove(fav); await _db.SaveChangesAsync(); }
    }

    public Task<List<FavoriteCurrency>> GetFavoritesAsync(int userId) =>
        _db.FavoriteCurrencies.Where(f => f.UserId == userId).OrderBy(f => f.AddedAt).ToListAsync();
}

// ─── Background Rate Monitor ──────────────────────────────────────────────────

public class RateMonitorService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<RateMonitorService> _logger;

    public RateMonitorService(IServiceProvider services, ILogger<RateMonitorService> logger)
    {
        _services = services; _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope       = _services.CreateScope();
                var db                = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var rateService       = scope.ServiceProvider.GetRequiredService<IExchangeRateService>();
                var hub               = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();

                var activeAlerts = await db.NotificationAlerts
                    .Where(a => a.IsActive && !a.IsTriggered)
                    .ToListAsync(stoppingToken);

                foreach (var alert in activeAlerts)
                {
                    var rate      = await rateService.GetRateAsync(alert.BaseCurrency, alert.TargetCurrency);
                    var triggered = alert.Condition == AlertCondition.Above
                        ? rate >= alert.TargetRate
                        : rate <= alert.TargetRate;

                    if (triggered)
                    {
                        alert.IsTriggered = true;
                        alert.TriggeredAt = DateTime.UtcNow;
                        var cond    = alert.Condition == AlertCondition.Above ? "reached above" : "dropped below";
                        var message = $"🔔 {alert.BaseCurrency}/{alert.TargetCurrency} has {cond} {alert.TargetRate:F4}. Current: {rate:F4}";

                        db.NotificationLogs.Add(new NotificationLog
                        {
                            UserId       = alert.UserId, Message = message,
                            CurrencyPair = $"{alert.BaseCurrency}/{alert.TargetCurrency}",
                            IsRead       = false, CreatedAt = DateTime.UtcNow
                        });

                        await hub.Clients.Group($"user_{alert.UserId}")
                            .SendAsync("RateAlert", new { message, pair = $"{alert.BaseCurrency}/{alert.TargetCurrency}" }, stoppingToken);
                    }
                }
                await db.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex) { _logger.LogError(ex, "Error in RateMonitorService"); }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}

// ─── SignalR Hub ──────────────────────────────────────────────────────────────

public class NotificationHub : Hub
{
    public async Task JoinUserGroup(string userId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
}
```

---

### Controllers/AccountController.cs {#accountctrl}

```csharp
using ExchangeRateApp.Models;
using ExchangeRateApp.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ExchangeRateApp.Controllers;

public class AccountController : Controller
{
    private readonly IUserService _userService;
    public AccountController(IUserService userService) { _userService = userService; }

    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        if (User.Identity?.IsAuthenticated == true)
            return RedirectToAction("Index", "Dashboard");
        ViewBag.ReturnUrl = returnUrl;
        return View(new LoginViewModel());
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        if (!ModelState.IsValid) return View(model);
        var user = await _userService.AuthenticateAsync(model.EmailOrUsername, model.Password);
        if (user == null)
        {
            ModelState.AddModelError("", "Invalid credentials. Please check your email/username and password.");
            return View(model);
        }
        await _userService.UpdateLastLoginAsync(user.Id);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new("FullName", user.FullName),
        };
        var props = new AuthenticationProperties
        {
            IsPersistent = model.RememberMe,
            ExpiresUtc   = model.RememberMe ? DateTimeOffset.UtcNow.AddDays(30) : DateTimeOffset.UtcNow.AddHours(8)
        };
        await HttpContext.SignInAsync("CookieAuth", new ClaimsPrincipal(new ClaimsIdentity(claims, "CookieAuth")), props);
        return !string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl)
            ? Redirect(returnUrl)
            : RedirectToAction("Index", "Dashboard");
    }

    [HttpGet]
    public IActionResult Register()
    {
        if (User.Identity?.IsAuthenticated == true) return RedirectToAction("Index", "Dashboard");
        return View(new RegisterViewModel());
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (!ModelState.IsValid) return View(model);
        var (success, error) = await _userService.RegisterAsync(model);
        if (!success) { ModelState.AddModelError("", error); return View(model); }
        TempData["Success"] = "Account created successfully! Please sign in.";
        return RedirectToAction("Login");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync("CookieAuth");
        return RedirectToAction("Login");
    }
}
```

---

### Controllers/Controllers.cs {#controllers}

```csharp
using ExchangeRateApp.Models;
using ExchangeRateApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ExchangeRateApp.Controllers;

[Authorize]
public class DashboardController : Controller
{
    private readonly IExchangeRateService _rateService;
    private readonly INotificationService _notifService;
    public DashboardController(IExchangeRateService r, INotificationService n) { _rateService=r; _notifService=n; }

    public async Task<IActionResult> Index()
    {
        var uid = GetUserId();
        return View(new DashboardViewModel
        {
            TopForex             = await _rateService.GetTopForexRatesAsync(),
            TopCrypto            = await _rateService.GetTopCryptoRatesAsync(),
            Favorites            = await _notifService.GetFavoritesAsync(uid),
            UnreadNotifications  = await _notifService.GetUnreadCountAsync(uid),
            LastUpdated          = DateTime.UtcNow
        });
    }
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}

[Authorize]
public class ConverterController : Controller
{
    private readonly IExchangeRateService _rateService;
    private readonly INotificationService _notifService;
    public ConverterController(IExchangeRateService r, INotificationService n) { _rateService=r; _notifService=n; }

    public async Task<IActionResult> Index(string from="USD", string to="EUR", double amount=1)
    {
        ViewBag.UnreadCount = await _notifService.GetUnreadCountAsync(GetUserId());
        var vm = new ConverterViewModel { AllCurrencies=_rateService.GetAllCurrencies(),
            FromCurrency=from.ToUpper(), ToCurrency=to.ToUpper(), Amount=amount };
        if (amount > 0) vm.Result = await _rateService.ConvertAsync(from, to, amount);
        return View(vm);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Convert(string from, string to, double amount)
    {
        ViewBag.UnreadCount = await _notifService.GetUnreadCountAsync(GetUserId());
        return View("Index", new ConverterViewModel
        {
            AllCurrencies = _rateService.GetAllCurrencies(),
            FromCurrency  = from?.ToUpper() ?? "USD", ToCurrency = to?.ToUpper() ?? "EUR",
            Amount        = amount, Result = await _rateService.ConvertAsync(from??"USD", to??"EUR", amount)
        });
    }
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}

[Authorize]
public class TrendsController : Controller
{
    private readonly IExchangeRateService _rateService;
    private readonly INotificationService _notifService;
    public TrendsController(IExchangeRateService r, INotificationService n) { _rateService=r; _notifService=n; }

    public async Task<IActionResult> Index(string @base="USD", string target="EUR", int days=30)
    {
        ViewBag.UnreadCount    = await _notifService.GetUnreadCountAsync(GetUserId());
        ViewBag.AllCurrencies  = _rateService.GetAllCurrencies();
        ViewBag.SelectedBase   = @base.ToUpper();
        ViewBag.SelectedTarget = target.ToUpper();
        ViewBag.SelectedDays   = days;
        return View(await _rateService.GetTrendDataAsync(@base, target, days));
    }

    [HttpGet]
    public async Task<IActionResult> GetChartData(string @base, string target, int days=30)
    {
        var trend = await _rateService.GetTrendDataAsync(@base, target, days);
        if (trend == null) return NotFound();
        return Json(trend.History.Select(h => new { date=h.Date.ToString("yyyy-MM-dd"), rate=Math.Round(h.Rate,6) }));
    }
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}

[Authorize]
public class FavoritesController : Controller
{
    private readonly INotificationService _notifService;
    private readonly IExchangeRateService _rateService;
    public FavoritesController(INotificationService n, IExchangeRateService r) { _notifService=n; _rateService=r; }

    public async Task<IActionResult> Index()
    {
        var uid = GetUserId();
        ViewBag.UnreadCount   = await _notifService.GetUnreadCountAsync(uid);
        ViewBag.AllCurrencies = _rateService.GetAllCurrencies();
        return View(await _notifService.GetFavoritesAsync(uid));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Add(string code, string name, string flag, bool isCrypto=false)
    {
        await _notifService.AddFavoriteAsync(GetUserId(), code, name, flag, isCrypto);
        TempData["Success"] = $"{code} added to favorites!";
        return RedirectToAction("Index");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Remove(string code)
    {
        await _notifService.RemoveFavoriteAsync(GetUserId(), code);
        TempData["Success"] = $"{code} removed from favorites.";
        return RedirectToAction("Index");
    }
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}

[Authorize]
public class NotificationsController : Controller
{
    private readonly INotificationService _notifService;
    private readonly IExchangeRateService _rateService;
    public NotificationsController(INotificationService n, IExchangeRateService r) { _notifService=n; _rateService=r; }

    public async Task<IActionResult> Index()
    {
        var uid = GetUserId();
        var vm  = new NotificationsViewModel
        {
            Alerts       = await _notifService.GetAlertsAsync(uid),
            Logs         = await _notifService.GetLogsAsync(uid),
            AllCurrencies= _rateService.GetAllCurrencies(),
            UnreadCount  = await _notifService.GetUnreadCountAsync(uid)
        };
        await _notifService.MarkLogsReadAsync(uid);
        return View(vm);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateAlert(CreateAlertViewModel model)
    {
        if (!ModelState.IsValid) { TempData["Error"] = "Please fill in all fields correctly."; return RedirectToAction("Index"); }
        await _notifService.CreateAlertAsync(GetUserId(), model);
        TempData["Success"] = $"Alert created for {model.BaseCurrency}/{model.TargetCurrency}!";
        return RedirectToAction("Index");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteAlert(int id)
    {
        await _notifService.DeleteAlertAsync(GetUserId(), id);
        TempData["Success"] = "Alert deleted.";
        return RedirectToAction("Index");
    }
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}
```

---

### Views/Shared/_Layout.cshtml {#layout}

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ViewData["Title"] — FXPulse</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
    @RenderSection("Styles", required: false)
</head>
<body>
@if (User.Identity?.IsAuthenticated == true)
{
    var unread = ViewBag.UnreadCount as int? ?? 0;
    <div class="app-shell">
        <nav class="sidebar">
            <div class="sidebar-logo">FX</div>
            <ul class="nav-list">
                <li><a asp-controller="Dashboard"     asp-action="Index" class="nav-link @(ViewContext.RouteData.Values["controller"]?.ToString()=="Dashboard"?"active":"")"><span class="nav-icon">⬡</span><span class="nav-label">Dashboard</span></a></li>
                <li><a asp-controller="Converter"     asp-action="Index" class="nav-link @(ViewContext.RouteData.Values["controller"]?.ToString()=="Converter"?"active":"")"><span class="nav-icon">⇄</span><span class="nav-label">Converter</span></a></li>
                <li><a asp-controller="Trends"        asp-action="Index" class="nav-link @(ViewContext.RouteData.Values["controller"]?.ToString()=="Trends"?"active":"")"><span class="nav-icon">↗</span><span class="nav-label">Trends</span></a></li>
                <li><a asp-controller="Favorites"     asp-action="Index" class="nav-link @(ViewContext.RouteData.Values["controller"]?.ToString()=="Favorites"?"active":"")"><span class="nav-icon">★</span><span class="nav-label">Favorites</span></a></li>
                <li>
                    <a asp-controller="Notifications" asp-action="Index" class="nav-link @(ViewContext.RouteData.Values["controller"]?.ToString()=="Notifications"?"active":"")">
                        <span class="nav-icon">🔔</span><span class="nav-label">Alerts</span>
                        @if (unread > 0) { <span class="badge">@unread</span> }
                    </a>
                </li>
            </ul>
            <div class="sidebar-footer">
                <div class="user-avatar">@User.Identity.Name?.Substring(0,1).ToUpper()</div>
                <form asp-controller="Account" asp-action="Logout" method="post" style="margin:0">
                    @Html.AntiForgeryToken()
                    <button type="submit" class="logout-btn" title="Logout">⏻</button>
                </form>
            </div>
        </nav>
        <main class="main-content">
            @if (TempData["Success"] != null) { <div class="toast toast-success">✓ @TempData["Success"]</div> }
            @if (TempData["Error"]   != null) { <div class="toast toast-error">✕ @TempData["Error"]</div>   }
            @RenderBody()
        </main>
    </div>
    <div id="realtime-toast" class="realtime-toast hidden"></div>
    <script src="~/lib/signalr/signalr.min.js"></script>
    <script>
        const userId = "@User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value";
        const connection = new signalR.HubConnectionBuilder().withUrl("/notificationHub").build();
        connection.on("RateAlert", (data) => {
            const el = document.getElementById('realtime-toast');
            el.textContent = data.message;
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('hidden'), 6000);
        });
        connection.start().then(() => connection.invoke("JoinUserGroup", userId)).catch(console.error);
        setTimeout(() => document.querySelectorAll('.toast').forEach(t => t.style.opacity='0'), 4000);
    </script>
}
else { @RenderBody() }
@RenderSection("Scripts", required: false)
</body>
</html>
```

---

### Views/Account/Login.cshtml {#login}

```html
@model ExchangeRateApp.Models.LoginViewModel
@{ ViewData["Title"]="Sign In"; Layout="_Layout"; }
<div class="auth-page">
    <div class="auth-bg-orb orb-1"></div>
    <div class="auth-bg-orb orb-2"></div>
    <div class="auth-card">
        <div class="auth-logo">
            <div class="logo-badge">FX</div>
            <div><div class="logo-title">FX<span>Pulse</span></div><div class="logo-sub">Real-time Exchange Rates</div></div>
        </div>
        <h1 class="auth-heading">Welcome back</h1>
        <p class="auth-subheading">Sign in to your account to continue</p>
        @if (TempData["Success"] != null) { <div class="alert alert-success">✓ @TempData["Success"]</div> }
        <form asp-action="Login" method="post">
            @Html.AntiForgeryToken()
            <div asp-validation-summary="All" class="alert alert-error"></div>
            <div class="form-group">
                <label asp-for="EmailOrUsername">Email or Username</label>
                <input asp-for="EmailOrUsername" placeholder="you@example.com" autocomplete="username" />
                <span asp-validation-for="EmailOrUsername" class="field-error"></span>
            </div>
            <div class="form-group">
                <label asp-for="Password">Password</label>
                <div class="input-with-toggle">
                    <input asp-for="Password" type="password" placeholder="••••••••" id="pwd-input" />
                    <button type="button" class="toggle-pwd" onclick="togglePwd()">👁</button>
                </div>
                <span asp-validation-for="Password" class="field-error"></span>
            </div>
            <div class="form-check-row">
                <label class="check-label"><input asp-for="RememberMe" type="checkbox"/><span>Remember me for 30 days</span></label>
            </div>
            <button type="submit" class="btn-auth">Sign In</button>
        </form>
        <div class="auth-switch">Don't have an account? <a asp-action="Register">Create one →</a></div>
        <div class="demo-hint"><span>Demo:</span> demo / demo123</div>
    </div>
</div>
@section Scripts {
<script>function togglePwd(){const i=document.getElementById('pwd-input');i.type=i.type==='password'?'text':'password';}</script>
}
```

---

### Views/Account/Register.cshtml {#register}

```html
@model ExchangeRateApp.Models.RegisterViewModel
@{ ViewData["Title"]="Create Account"; Layout="_Layout"; }
<div class="auth-page">
    <div class="auth-bg-orb orb-1"></div>
    <div class="auth-bg-orb orb-2"></div>
    <div class="auth-card">
        <div class="auth-logo">
            <div class="logo-badge">FX</div>
            <div><div class="logo-title">FX<span>Pulse</span></div><div class="logo-sub">Real-time Exchange Rates</div></div>
        </div>
        <h1 class="auth-heading">Create account</h1>
        <p class="auth-subheading">Join FXPulse and track rates in real-time</p>
        <form asp-action="Register" method="post">
            @Html.AntiForgeryToken()
            <div asp-validation-summary="All" class="alert alert-error"></div>
            <div class="form-row-2">
                <div class="form-group"><label asp-for="FullName">Full Name</label><input asp-for="FullName" placeholder="John Doe"/><span asp-validation-for="FullName" class="field-error"></span></div>
                <div class="form-group"><label asp-for="Username">Username</label><input asp-for="Username" placeholder="johndoe"/><span asp-validation-for="Username" class="field-error"></span></div>
            </div>
            <div class="form-group"><label asp-for="Email">Email Address</label><input asp-for="Email" type="email" placeholder="you@example.com"/><span asp-validation-for="Email" class="field-error"></span></div>
            <div class="form-row-2">
                <div class="form-group"><label asp-for="Password">Password</label><input asp-for="Password" type="password" placeholder="Min 6 chars"/><span asp-validation-for="Password" class="field-error"></span></div>
                <div class="form-group"><label asp-for="ConfirmPassword">Confirm Password</label><input asp-for="ConfirmPassword" type="password" placeholder="••••••••"/><span asp-validation-for="ConfirmPassword" class="field-error"></span></div>
            </div>
            <button type="submit" class="btn-auth">Create Account</button>
        </form>
        <div class="auth-switch">Already have an account? <a asp-action="Login">Sign in →</a></div>
    </div>
</div>
```

---

### Views/Dashboard/Index.cshtml {#dashboard}

```html
@model ExchangeRateApp.Models.DashboardViewModel
@using System.Security.Claims
@{ ViewData["Title"]="Dashboard"; ViewBag.UnreadCount=Model.UnreadNotifications;
   var userName = User.FindFirstValue("FullName") ?? User.Identity?.Name ?? "User"; }

<div class="page-header">
    <div>
        <h1>Good @(DateTime.Now.Hour<12?"morning":DateTime.Now.Hour<18?"afternoon":"evening"), @userName.Split(' ')[0] 👋</h1>
        <p class="page-sub">Market overview · Updated <span>@Model.LastUpdated.ToLocalTime().ToString("HH:mm")</span></p>
    </div>
    <div class="header-actions"><span class="live-badge">● LIVE</span></div>
</div>

<div class="stats-strip">
    @foreach(var s in new[]{("💱","Currencies Tracked","59","World currencies"),("₿","Crypto Markets","5","Top by market cap"),
        ("★","Your Favorites",Model.Favorites.Count.ToString(),"Manage →"),("🔔","Active Alerts",Model.UnreadNotifications.ToString(),"View all →")})
    {
        <div class="stat-card">
            <div class="stat-icon">@s.Item1</div>
            <div class="stat-label">@s.Item2</div>
            <div class="stat-value">@s.Item3</div>
            <div class="stat-sub">@s.Item4</div>
        </div>
    }
</div>

<div class="dashboard-grid">
    <div class="card">
        <div class="card-header"><div class="section-title">🌍 Top Forex Pairs</div><a asp-controller="Converter" asp-action="Index" class="card-link">Convert →</a></div>
        <div class="rate-list">
            @foreach (var pair in Model.TopForex)
            {
                <a asp-controller="Trends" asp-action="Index" asp-route-base="@pair.BaseCurrency" asp-route-target="@pair.TargetCurrency" class="rate-row">
                    <div class="rate-flags"><span>@pair.BaseFlag</span><span>@pair.TargetFlag</span></div>
                    <div class="rate-info"><div class="rate-pair">@pair.BaseCurrency/@pair.TargetCurrency</div><div class="rate-name">@pair.TargetName</div></div>
                    <div class="rate-sparkline-wrap"><canvas class="mini-spark" data-pair="@pair.BaseCurrency-@pair.TargetCurrency" width="60" height="30"></canvas></div>
                    <div class="rate-values">
                        <div class="rate-value">@pair.Rate.ToString("F4")</div>
                        <div class="rate-change @(pair.ChangePercent>=0?"up":"down")">@(pair.ChangePercent>=0?"▲":"▼") @Math.Abs(pair.ChangePercent).ToString("F2")%</div>
                    </div>
                </a>
            }
        </div>
    </div>
    <div class="card">
        <div class="card-header"><div class="section-title">🪙 Top Cryptocurrencies vs USD</div><span class="update-note">24h change</span></div>
        <div class="rate-list">
            @foreach (var crypto in Model.TopCrypto)
            {
                <div class="rate-row crypto-row">
                    <div class="crypto-icon" style="background:@crypto.Color20()"><span style="color:@crypto.Color">@crypto.Icon</span></div>
                    <div class="rate-info"><div class="rate-pair">@crypto.Symbol/USD</div><div class="rate-name">@crypto.Name</div></div>
                    <div class="rate-values">
                        <div class="rate-value">$@crypto.PriceUsd.ToString("N2")</div>
                        <div class="rate-change @(crypto.ChangePercent24h>=0?"up":"down")">@(crypto.ChangePercent24h>=0?"▲":"▼") @Math.Abs(crypto.ChangePercent24h).ToString("F2")%</div>
                    </div>
                </div>
            }
        </div>
    </div>
</div>

@if (Model.Favorites.Any())
{
    <div class="card mt-20">
        <div class="card-header"><div class="section-title">★ Your Favorites</div><a asp-controller="Favorites" asp-action="Index" class="card-link">Manage →</a></div>
        <div class="favorites-strip">
            @foreach (var fav in Model.Favorites.Take(8))
            {
                <a asp-controller="Trends" asp-action="Index" asp-route-base="USD" asp-route-target="@fav.CurrencyCode" class="fav-chip">
                    <span class="fav-flag">@fav.Flag</span><span class="fav-code">@fav.CurrencyCode</span><span class="fav-name">@fav.CurrencyName</span>
                </a>
            }
        </div>
    </div>
}

@section Scripts {
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
const pairs = @Html.Raw(System.Text.Json.JsonSerializer.Serialize(
    Model.TopForex.Select(p=>new{key=p.BaseCurrency+"-"+p.TargetCurrency,up=p.ChangePercent>=0})));
pairs.forEach(async p => {
    const canvas = document.querySelector(`.mini-spark[data-pair="${p.key}"]`);
    if (!canvas) return;
    const [b,t] = p.key.split('-');
    try {
        const resp = await fetch(`/Trends/GetChartData?base=${b}&target=${t}&days=7`);
        const data = await resp.json();
        new Chart(canvas, {
            type:'line',
            data:{labels:data.map(d=>d.date),datasets:[{data:data.map(d=>d.rate),
                borderColor:p.up?'#00e5b4':'#ff4d6d',borderWidth:1.5,pointRadius:0,fill:false,tension:0.4}]},
            options:{plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}},responsive:false}
        });
    } catch(e) {}
});
</script>
}

@functions {
    string FormatLarge(double v){
        if(v>=1_000_000_000_000)return$"{v/1_000_000_000_000:F1}T";
        if(v>=1_000_000_000)return$"{v/1_000_000_000:F1}B";
        return$"{v/1_000_000:F1}M";
    }
}
```

---

### Views/Converter/Index.cshtml {#converter}

```html
@model ExchangeRateApp.Models.ConverterViewModel
@{ ViewData["Title"]="Currency Converter"; }
<div class="page-header"><div><h1>Currency Converter</h1><p class="page-sub">Convert between any of 53 world currencies</p></div></div>
<div class="converter-wrap">
    <div class="card">
        <form asp-action="Convert" method="post" id="converterForm">
            @Html.AntiForgeryToken()
            <div class="converter-grid">
                <div class="conv-side">
                    <label class="conv-label">From</label>
                    <select name="from" id="fromCurrency" class="currency-select" onchange="this.form.submit()">
                        @foreach(var c in Model.AllCurrencies){<option value="@c.Code" @(c.Code==Model.FromCurrency?"selected":"")>@c.Flag @c.Code – @c.Name</option>}
                    </select>
                    <input type="number" name="amount" value="@Model.Amount" step="any" min="0" class="amount-input" placeholder="1.00"/>
                </div>
                <div class="conv-swap">
                    <button type="button" class="swap-btn" onclick="swapCurrencies()">⇄</button>
                </div>
                <div class="conv-side">
                    <label class="conv-label">To</label>
                    <select name="to" id="toCurrency" class="currency-select" onchange="this.form.submit()">
                        @foreach(var c in Model.AllCurrencies){<option value="@c.Code" @(c.Code==Model.ToCurrency?"selected":"")>@c.Flag @c.Code – @c.Name</option>}
                    </select>
                    <div class="amount-display">
                        @if(Model.Result!=null){<span class="result-number">@Model.Result.Result.ToString("N6")</span>}
                        else{<span class="result-placeholder">—</span>}
                    </div>
                </div>
            </div>
            <button type="submit" class="btn-convert">Convert →</button>
        </form>
        @if(Model.Result!=null){
            var r=Model.Result;
            <div class="result-box">
                <div class="result-main">
                    <span class="result-flag">@r.FromFlag</span><span class="result-from">@r.Amount.ToString("N2") @r.FromCurrency</span>
                    <span class="result-eq">=</span>
                    <span class="result-flag">@r.ToFlag</span><span class="result-to">@r.Result.ToString("N4") @r.ToCurrency</span>
                </div>
                <div class="result-rates">
                    <div class="rate-item"><span>1 @r.FromCurrency</span><span>=</span><span class="rate-val">@r.Rate.ToString("N6") @r.ToCurrency</span></div>
                    <div class="rate-item"><span>1 @r.ToCurrency</span><span>=</span><span class="rate-val">@r.InverseRate.ToString("N6") @r.FromCurrency</span></div>
                </div>
                <div class="result-timestamp">Updated @r.Timestamp.ToLocalTime().ToString("HH:mm:ss, MMM dd yyyy")</div>
            </div>
            <div class="quick-conv-title">Quick Reference</div>
            <div class="quick-conv-table">
                @foreach(var m in new[]{1,5,10,25,50,100,500,1000}){
                    <div class="qc-row"><span>@m @r.FromCurrency</span><span>→</span><span>@((m*r.Rate).ToString("N4")) @r.ToCurrency</span></div>}
            </div>
        }
    </div>
    <div class="card mt-20">
        <div class="section-title">Popular Pairs</div>
        <div class="popular-pairs">
            @foreach(var(f,t) in new[]{("USD","EUR"),("USD","GBP"),("USD","JPY"),("USD","CAD"),("BRL","HNL"),("EUR","BRL"),("GBP","JPY"),("USD","BRL")}){
                <a href="?from=@f&to=@t&amount=1" class="pair-chip @(Model.FromCurrency==f&&Model.ToCurrency==t?"active":"")">@f / @t</a>}
        </div>
    </div>
</div>
@section Scripts {
<script>
function swapCurrencies(){
    const f=document.getElementById('fromCurrency'),t=document.getElementById('toCurrency'),tmp=f.value;
    f.value=t.value;t.value=tmp;document.getElementById('converterForm').submit();
}
</script>}
```

---

### Views/Trends/Index.cshtml {#trends}

```html
@model ExchangeRateApp.Models.TrendData?
@{ ViewData["Title"]="Currency Trends";
   var allCurrencies=ViewBag.AllCurrencies as List<ExchangeRateApp.Models.CurrencyInfo>??new();
   var selBase=ViewBag.SelectedBase as string??"USD";
   var selTarget=ViewBag.SelectedTarget as string??"EUR";
   var selDays=ViewBag.SelectedDays as int???30; }

<div class="page-header"><div><h1>Currency Trends</h1><p class="page-sub">Historical exchange rate charts and analysis</p></div></div>

<div class="card trend-selector">
    <form method="get" asp-action="Index" class="trend-form">
        <div class="trend-form-grid">
            <div class="form-group"><label>Base Currency</label>
                <select name="base" class="currency-select" onchange="this.form.submit()">
                    @foreach(var c in allCurrencies){<option value="@c.Code" @(c.Code==selBase?"selected":"")>@c.Flag @c.Code – @c.Name</option>}
                </select></div>
            <div class="trend-vs">VS</div>
            <div class="form-group"><label>Target Currency</label>
                <select name="target" class="currency-select" onchange="this.form.submit()">
                    @foreach(var c in allCurrencies){<option value="@c.Code" @(c.Code==selTarget?"selected":"")>@c.Flag @c.Code – @c.Name</option>}
                </select></div>
            <div class="form-group"><label>Period</label>
                <select name="days" class="currency-select" onchange="this.form.submit()">
                    @foreach(var d in new[]{7,14,30,60,90}){<option value="@d" @(selDays==d?"selected":"")>@d Days</option>}
                </select></div>
        </div>
    </form>
</div>

@if(Model!=null){
    <div class="trend-stats">
        <div class="trend-stat-card"><div class="tsc-label">Current Rate</div><div class="tsc-value">@Model.CurrentRate.ToString("N6")</div></div>
        <div class="trend-stat-card"><div class="tsc-label">@selDays-Day Change</div><div class="tsc-value @(Model.ChangePercent>=0?"up":"down")">@(Model.ChangePercent>=0?"▲":"▼") @Math.Abs(Model.ChangePercent).ToString("F2")%</div></div>
        <div class="trend-stat-card"><div class="tsc-label">Period High</div><div class="tsc-value up">@Model.High.ToString("N6")</div></div>
        <div class="trend-stat-card"><div class="tsc-label">Period Low</div><div class="tsc-value down">@Model.Low.ToString("N6")</div></div>
    </div>
    <div class="card chart-card">
        <div class="chart-header">
            <div><div class="chart-title">@selBase / @selTarget</div><div class="chart-sub">@Model.BaseFlag @Model.BaseName → @Model.TargetFlag @Model.TargetName</div></div>
            <div class="chart-badge @(Model.ChangePercent>=0?"badge-up":"badge-down")">@(Model.ChangePercent>=0?"▲":"▼") @Math.Abs(Model.ChangePercent).ToString("F2")%</div>
        </div>
        <canvas id="trendChart" height="100"></canvas>
    </div>
    <div class="card mt-20">
        <div class="section-title">Historical Data</div>
        <div class="data-table-wrap">
            <table class="data-table">
                <thead><tr><th>Date</th><th>Rate</th><th>Change</th></tr></thead>
                <tbody>
                    @for(int i=Model.History.Count-1;i>=0;i--){
                        var pt=Model.History[i]; var prev=i>0?Model.History[i-1].Rate:pt.Rate;
                        var chg=(pt.Rate-prev)/prev*100;
                        <tr><td>@pt.Date.ToString("MMM dd, yyyy")</td><td class="mono">@pt.Rate.ToString("N6")</td>
                        <td class="@(chg>=0?"up":"down")">@(i==0?"—":$"{(chg>=0?"▲":"▼")} {Math.Abs(chg):F4}%")</td></tr>
                    }
                </tbody>
            </table>
        </div>
    </div>
}
@section Scripts {
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
@if(Model!=null){
<script>
const data=@Html.Raw(System.Text.Json.JsonSerializer.Serialize(Model.History.Select(h=>new{date=h.Date.ToString("MMM dd"),rate=Math.Round(h.Rate,6)})));
const isUp=@(Model.ChangePercent>=0?"true":"false");
new Chart(document.getElementById('trendChart'),{
    type:'line',data:{labels:data.map(d=>d.date),
    datasets:[{data:data.map(d=>d.rate),borderColor:isUp?'#00e5b4':'#ff4d6d',
    backgroundColor:(isUp?'#00e5b4':'#ff4d6d')+'18',borderWidth:2,pointRadius:3,fill:true,tension:0.4}]},
    options:{responsive:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#0d1220',
    callbacks:{label:ctx=>`Rate: ${ctx.parsed.y.toFixed(6)}`}}},
    scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6282',maxTicksLimit:8}},
    y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6282',callback:v=>v.toFixed(4)}}}}
});
</script>}
}
```

---

### Views/Favorites/Index.cshtml {#favorites}

```html
@model List<ExchangeRateApp.Models.FavoriteCurrency>
@{ ViewData["Title"]="Favorite Currencies"; var allCurrencies=ViewBag.AllCurrencies as List<ExchangeRateApp.Models.CurrencyInfo>??new(); }
<div class="page-header"><div><h1>Favorite Currencies</h1><p class="page-sub">Quickly access the currencies you care about</p></div></div>
<div class="favorites-layout">
    <div class="card">
        <div class="card-header"><div class="section-title">★ Your Favorites (@Model.Count)</div></div>
        @if(!Model.Any()){<div class="empty-state"><div class="empty-icon">★</div><div class="empty-title">No favorites yet</div></div>}
        else{<div class="fav-list">
            @foreach(var fav in Model){
                <div class="fav-item">
                    <span class="fav-flag-lg">@fav.Flag</span>
                    <div class="fav-details"><div class="fav-code-lg">@fav.CurrencyCode</div><div class="fav-name-lg">@fav.CurrencyName</div></div>
                    <div class="fav-actions">
                        <a asp-controller="Converter" asp-action="Index" asp-route-from="USD" asp-route-to="@fav.CurrencyCode" class="btn-sm btn-outline">Convert</a>
                        <a asp-controller="Trends" asp-action="Index" asp-route-base="USD" asp-route-target="@fav.CurrencyCode" class="btn-sm btn-outline">Trend</a>
                        <form asp-action="Remove" method="post" style="display:inline">
                            @Html.AntiForgeryToken()<input type="hidden" name="code" value="@fav.CurrencyCode"/>
                            <button type="submit" class="btn-sm btn-danger">✕</button>
                        </form>
                    </div>
                </div>
            }
        </div>}
    </div>
    <div class="card">
        <div class="card-header"><div class="section-title">+ Add Currency</div></div>
        <input type="text" id="currSearch" placeholder="🔍 Search..." class="search-input"/>
        <div class="currency-browser" id="currencyList">
            @foreach(var c in allCurrencies){
                var isFav=Model.Any(f=>f.CurrencyCode==c.Code);
                <div class="currency-item @(isFav?"is-fav":"")" data-search="@c.Code.ToLower() @c.Name.ToLower()">
                    <span class="ci-flag">@c.Flag</span>
                    <div class="ci-info"><div class="ci-code">@c.Code</div><div class="ci-name">@c.Name</div></div>
                    @if(!isFav){<form asp-action="Add" method="post">@Html.AntiForgeryToken()
                        <input type="hidden" name="code" value="@c.Code"/><input type="hidden" name="name" value="@c.Name"/><input type="hidden" name="flag" value="@c.Flag"/>
                        <button type="submit" class="btn-sm btn-add">+ Add</button></form>}
                    else{<span class="fav-badge">★ Added</span>}
                </div>
            }
        </div>
    </div>
</div>
@section Scripts {
<script>document.getElementById('currSearch').addEventListener('input',function(){
    const q=this.value.toLowerCase();
    document.querySelectorAll('.currency-item').forEach(el=>el.style.display=el.dataset.search.includes(q)?'':'none');
});</script>}
```

---

### Views/Notifications/Index.cshtml {#notifications}

```html
@model ExchangeRateApp.Models.NotificationsViewModel
@{ ViewData["Title"]="Rate Alerts"; ViewBag.UnreadCount=Model.UnreadCount; }
<div class="page-header"><div><h1>Rate Change Alerts</h1><p class="page-sub">Get notified when currencies hit your target rates</p></div></div>
<div class="notif-layout">
    <div class="card">
        <div class="section-title">+ Create New Alert</div>
        <form asp-action="CreateAlert" method="post">
            @Html.AntiForgeryToken()
            <div class="alert-form-grid">
                <div class="form-group"><label>Base</label>
                    <select name="BaseCurrency" class="currency-select">@foreach(var c in Model.AllCurrencies){<option value="@c.Code" @(c.Code=="USD"?"selected":"")>@c.Flag @c.Code</option>}</select></div>
                <div class="form-group"><label>Target</label>
                    <select name="TargetCurrency" class="currency-select">@foreach(var c in Model.AllCurrencies){<option value="@c.Code" @(c.Code=="EUR"?"selected":"")>@c.Flag @c.Code</option>}</select></div>
                <div class="form-group"><label>Condition</label>
                    <select name="Condition" class="currency-select"><option value="0">▲ Rate goes Above</option><option value="1">▼ Rate goes Below</option></select></div>
                <div class="form-group"><label>Target Rate</label>
                    <input type="number" name="TargetRate" step="0.0001" min="0.0001" placeholder="e.g. 1.1000" class="amount-input"/></div>
            </div>
            <button type="submit" class="btn-auth" style="max-width:220px">Create Alert 🔔</button>
        </form>
    </div>
    <div class="card">
        <div class="card-header"><div class="section-title">Active Alerts (@Model.Alerts.Count(a=>a.IsActive&&!a.IsTriggered))</div></div>
        @if(!Model.Alerts.Any()){<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">No alerts set</div></div>}
        else{<div class="alerts-list">
            @foreach(var alert in Model.Alerts){
                <div class="alert-item @(alert.IsTriggered?"triggered":"")">
                    <div class="alert-pair"><span class="alert-currencies">@alert.BaseCurrency / @alert.TargetCurrency</span>
                        <span class="alert-status @(alert.IsTriggered?"status-triggered":"status-active")">@(alert.IsTriggered?"✓ Triggered":"● Active")</span></div>
                    <div class="alert-condition">
                        <span class="cond-badge @(alert.Condition==ExchangeRateApp.Models.AlertCondition.Above?"cond-above":"cond-below")">
                            @(alert.Condition==ExchangeRateApp.Models.AlertCondition.Above?"▲ ABOVE":"▼ BELOW")</span>
                        <span class="cond-rate">@alert.TargetRate.ToString("N4")</span></div>
                    <div class="alert-meta">Created @alert.CreatedAt.ToLocalTime().ToString("MMM dd, HH:mm")</div>
                    <form asp-action="DeleteAlert" method="post" style="display:inline">
                        @Html.AntiForgeryToken()<input type="hidden" name="id" value="@alert.Id"/>
                        <button type="submit" class="btn-sm btn-danger">Delete</button>
                    </form>
                </div>
            }
        </div>}
    </div>
    <div class="card">
        <div class="card-header"><div class="section-title">Notification History</div></div>
        @if(!Model.Logs.Any()){<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No notifications yet</div></div>}
        else{<div class="log-list">
            @foreach(var log in Model.Logs){
                <div class="log-item @(!log.IsRead?"unread":"")">
                    <div class="log-icon">🔔</div>
                    <div class="log-body"><div class="log-msg">@log.Message</div><div class="log-time">@log.CreatedAt.ToLocalTime().ToString("MMM dd, yyyy HH:mm")</div></div>
                    @if(!log.IsRead){<span class="unread-dot"></span>}
                </div>
            }
        </div>}
    </div>
</div>
```

---

### Views/_ViewImports.cshtml {#viewimports}

```html
@using ExchangeRateApp
@using ExchangeRateApp.Models
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
```

---

### Views/_ViewStart.cshtml {#viewstart}

```html
@{ Layout = "_Layout"; }
```

---

### Views/Shared/Error.cshtml {#error}

```html
@{ ViewData["Title"]="Error"; }
<div class="auth-page">
    <div class="auth-card" style="text-align:center">
        <div style="font-size:64px;margin-bottom:16px">⚠️</div>
        <h1 style="font-size:28px;margin-bottom:8px">Something went wrong</h1>
        <p style="color:var(--muted);margin-bottom:24px">An unexpected error occurred.</p>
        <a href="/" class="btn-auth" style="display:inline-block;width:auto;padding:12px 32px">Go Home</a>
    </div>
</div>
```

---

### wwwroot/css/site.css {#css}

> This file is large. Save as `wwwroot/css/site.css`.

```css
/* ─── Variables ─────────────────────────────────────────────────────────────── */
:root {
  --bg:#06080f; --surface:#0b0f1a; --surface2:#101525; --surface3:#141929;
  --border:rgba(255,255,255,0.06); --border-hover:rgba(255,255,255,0.12);
  --accent:#00e5b4; --accent2:#ff6b35; --accent3:#7c6af7;
  --text:#e8eaf6; --muted:#5a6282; --up:#00e5b4; --down:#ff4d6d;
  --font:'Syne',sans-serif; --mono:'Space Mono',monospace;
  --sidebar-w:200px; --radius:16px; --radius-sm:10px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:15px;line-height:1.5;}
a{color:var(--accent);text-decoration:none;}
a:hover{opacity:0.85;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:var(--border-hover);border-radius:2px;}

/* Auth */
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden;
  background:radial-gradient(ellipse at 15% 25%,rgba(0,229,180,0.07) 0%,transparent 50%),
             radial-gradient(ellipse at 85% 75%,rgba(124,106,247,0.07) 0%,transparent 50%),var(--bg);}
.auth-bg-orb{position:fixed;border-radius:50%;pointer-events:none;animation:floatOrb 8s ease-in-out infinite;}
.orb-1{width:400px;height:400px;top:-100px;left:-100px;background:radial-gradient(circle,rgba(0,229,180,0.05),transparent 70%);}
.orb-2{width:350px;height:350px;bottom:-80px;right:-80px;background:radial-gradient(circle,rgba(124,106,247,0.05),transparent 70%);animation-delay:4s;}
@keyframes floatOrb{0%,100%{transform:translate(0,0)}50%{transform:translate(15px,20px)}}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,229,180,0.25)}50%{box-shadow:0 0 40px rgba(0,229,180,0.4)}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.auth-card{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:36px 40px;
  width:100%;max-width:460px;box-shadow:0 40px 80px rgba(0,0,0,0.7);animation:slideUp 0.45s cubic-bezier(.16,1,.3,1);position:relative;z-index:1;}
.auth-logo{display:flex;align-items:center;gap:14px;margin-bottom:32px;}
.logo-badge{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent3));
  display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:var(--bg);animation:glow 3s ease-in-out infinite;}
.logo-title{font-size:22px;font-weight:900;letter-spacing:-0.5px;}
.logo-title span{color:var(--accent);}
.logo-sub{font-size:12px;color:var(--muted);}
.auth-heading{font-size:28px;font-weight:800;letter-spacing:-1px;margin-bottom:6px;}
.auth-subheading{color:var(--muted);font-size:14px;margin-bottom:28px;}
.form-group{margin-bottom:18px;}
.form-group label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted);margin-bottom:8px;}
.form-group input,.currency-select,.amount-input,.search-input{width:100%;padding:13px 16px;background:var(--surface2);
  border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:14px;
  outline:none;transition:border-color 0.2s,box-shadow 0.2s;}
.form-group input:focus,.currency-select:focus,.amount-input:focus,.search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,229,180,0.12);}
.form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.input-with-toggle{position:relative;}
.input-with-toggle input{padding-right:44px;}
.toggle-pwd{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;color:var(--muted);}
.form-check-row{margin-bottom:20px;}
.check-label{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);cursor:pointer;}
.check-label input{width:16px;height:16px;accent-color:var(--accent);}
.btn-auth{width:100%;padding:15px;border:none;border-radius:var(--radius-sm);
  background:linear-gradient(135deg,var(--accent),#00b894);color:var(--bg);font-family:var(--font);
  font-size:15px;font-weight:800;cursor:pointer;transition:transform 0.15s,box-shadow 0.2s;}
.btn-auth:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(0,229,180,0.3);}
.auth-switch{text-align:center;margin-top:20px;font-size:14px;color:var(--muted);}
.auth-switch a{color:var(--accent);font-weight:700;}
.demo-hint{text-align:center;margin-top:14px;background:rgba(0,229,180,0.06);border:1px solid rgba(0,229,180,0.15);
  border-radius:var(--radius-sm);padding:10px 16px;font-size:12px;color:var(--muted);font-family:var(--mono);}
.demo-hint span{color:var(--accent);font-weight:700;}
.alert{border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:16px;font-size:13px;}
.alert-error{background:rgba(255,77,109,0.12);border:1px solid rgba(255,77,109,0.3);color:var(--down);}
.alert-success{background:rgba(0,229,180,0.1);border:1px solid rgba(0,229,180,0.3);color:var(--accent);}
.field-error{color:var(--down);font-size:12px;display:block;margin-top:4px;}

/* App Shell */
.app-shell{display:flex;min-height:100vh;}
.sidebar{width:var(--sidebar-w);background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;padding:20px 12px;position:fixed;height:100vh;z-index:50;overflow-y:auto;}
.sidebar-logo{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent3));
  display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:var(--bg);margin:0 auto 28px;}
.nav-list{list-style:none;display:flex;flex-direction:column;gap:4px;flex:1;}
.nav-link{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:var(--radius-sm);color:var(--muted);
  transition:background 0.18s,color 0.18s;font-weight:600;font-size:14px;position:relative;}
.nav-link:hover{background:var(--surface2);color:var(--text);}
.nav-link.active{background:rgba(0,229,180,0.1);color:var(--accent);}
.nav-icon{font-size:16px;width:20px;text-align:center;}
.badge{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:var(--accent2);color:white;
  font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;padding:0 4px;}
.sidebar-footer{display:flex;align-items:center;gap:10px;padding:12px 4px 0;border-top:1px solid var(--border);margin-top:auto;}
.user-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent3),var(--accent));
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:white;flex-shrink:0;}
.logout-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:4px;transition:color 0.2s;}
.logout-btn:hover{color:var(--down);}
.main-content{margin-left:var(--sidebar-w);flex:1;padding:32px 36px;max-width:calc(100vw - var(--sidebar-w));}

/* Page Header */
.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;}
.page-header h1{font-size:26px;font-weight:900;letter-spacing:-0.8px;}
.page-sub{color:var(--muted);font-size:13px;margin-top:4px;}
.live-badge{background:rgba(0,229,180,0.12);border:1px solid rgba(0,229,180,0.25);color:var(--accent);
  font-size:11px;font-weight:700;letter-spacing:1px;padding:7px 14px;border-radius:20px;animation:pulse 2s ease infinite;}

/* Cards */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;transition:border-color 0.2s;}
.card:hover{border-color:var(--border-hover);}
.card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);}
.card-link{font-size:13px;color:var(--accent);font-weight:600;}
.update-note{font-size:12px;color:var(--muted);}
.mt-20{margin-top:20px;}

/* Stats Strip */
.stats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;transition:border-color 0.2s,transform 0.2s;}
.stat-card:hover{border-color:var(--border-hover);transform:translateY(-2px);}
.stat-icon{font-size:22px;margin-bottom:8px;}
.stat-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:4px;}
.stat-value{font-size:26px;font-weight:900;font-family:var(--mono);letter-spacing:-1px;}
.stat-sub{font-size:11px;color:var(--muted);margin-top:4px;}

/* Dashboard Grid */
.dashboard-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;}
.rate-list{display:flex;flex-direction:column;}
.rate-row{display:flex;align-items:center;padding:10px 8px;border-bottom:1px solid var(--border);
  border-radius:var(--radius-sm);transition:background 0.15s;cursor:pointer;color:var(--text);margin:0 -8px;}
.rate-row:last-child{border-bottom:none;}
.rate-row:hover{background:rgba(255,255,255,0.02);}
.rate-flags{font-size:18px;letter-spacing:-2px;min-width:46px;}
.crypto-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;
  font-size:16px;font-weight:700;margin-right:12px;flex-shrink:0;}
.rate-info{flex:1;margin-left:10px;}
.rate-pair{font-size:14px;font-weight:700;}
.rate-name{font-size:11px;color:var(--muted);}
.rate-sparkline-wrap{margin:0 10px;}
.rate-values{text-align:right;}
.rate-value{font-family:var(--mono);font-size:14px;font-weight:700;}
.rate-change{font-size:11px;font-weight:700;margin-top:2px;}
.up{color:var(--up);}
.down{color:var(--down);}

/* Favorites Strip */
.favorites-strip{display:flex;gap:12px;flex-wrap:wrap;}
.fav-chip{display:flex;flex-direction:column;align-items:center;padding:14px 18px;
  background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);
  color:var(--text);transition:border-color 0.2s,transform 0.15s;min-width:80px;}
.fav-chip:hover{border-color:rgba(0,229,180,0.3);transform:translateY(-2px);}
.fav-flag{font-size:22px;margin-bottom:4px;}
.fav-code{font-size:12px;font-weight:700;}
.fav-name{font-size:10px;color:var(--muted);}

/* Toasts */
.toast{position:fixed;top:24px;right:24px;z-index:999;padding:14px 20px;border-radius:var(--radius-sm);
  font-size:14px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.4);transition:opacity 0.5s;}
.toast-success{background:rgba(0,229,180,0.15);border:1px solid var(--accent);color:var(--accent);}
.toast-error{background:rgba(255,77,109,0.15);border:1px solid var(--down);color:var(--down);}
.realtime-toast{position:fixed;bottom:24px;right:24px;z-index:999;background:var(--surface);
  border:1px solid var(--accent);border-radius:var(--radius);padding:16px 20px;max-width:340px;
  font-size:14px;box-shadow:0 8px 32px rgba(0,229,180,0.2);}
.realtime-toast.hidden{display:none;}

/* Converter */
.converter-wrap{max-width:700px;}
.converter-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:end;margin-bottom:20px;}
.conv-side{display:flex;flex-direction:column;gap:8px;}
.conv-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted);}
.conv-swap{display:flex;align-items:center;justify-content:center;padding-bottom:2px;}
.swap-btn{width:48px;height:48px;border-radius:50%;border:1px solid var(--border);background:var(--surface2);
  color:var(--accent);font-size:20px;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;justify-content:center;}
.swap-btn:hover{background:rgba(0,229,180,0.1);border-color:var(--accent);transform:rotate(180deg);}
.currency-select{appearance:none;cursor:pointer;}
.amount-input{font-family:var(--mono)!important;font-size:20px!important;font-weight:700!important;}
.amount-display{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:13px 16px;min-height:52px;display:flex;align-items:center;}
.result-number{font-family:var(--mono);font-size:20px;font-weight:700;color:var(--accent);}
.result-placeholder{color:var(--muted);}
.btn-convert{padding:14px 32px;border:none;border-radius:var(--radius-sm);
  background:linear-gradient(135deg,var(--accent),#00b894);color:var(--bg);font-family:var(--font);
  font-size:15px;font-weight:800;cursor:pointer;transition:transform 0.15s,box-shadow 0.2s;}
.btn-convert:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(0,229,180,0.3);}
.result-box{background:linear-gradient(135deg,rgba(0,229,180,0.06),rgba(124,106,247,0.06));
  border:1px solid rgba(0,229,180,0.2);border-radius:var(--radius);padding:24px;margin-top:20px;}
.result-main{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;
  padding-bottom:14px;border-bottom:1px solid var(--border);}
.result-flag{font-size:22px;}
.result-from{font-family:var(--mono);font-size:18px;font-weight:700;}
.result-eq{color:var(--muted);font-size:16px;margin:0 4px;}
.result-to{font-family:var(--mono);font-size:22px;font-weight:900;color:var(--accent);}
.result-rates{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;}
.rate-item{display:flex;gap:12px;align-items:center;font-size:13px;color:var(--muted);}
.rate-val{color:var(--text);font-family:var(--mono);font-weight:600;}
.result-timestamp{font-size:11px;color:var(--muted);}
.quick-conv-title{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted);margin:20px 0 10px;}
.quick-conv-table{display:flex;flex-direction:column;gap:4px;}
.qc-row{display:flex;gap:16px;padding:8px 12px;border-radius:8px;font-size:13px;font-family:var(--mono);}
.qc-row:nth-child(even){background:var(--surface2);}
.popular-pairs{display:flex;gap:10px;flex-wrap:wrap;}
.pair-chip{padding:8px 16px;background:var(--surface);border:1px solid var(--border);border-radius:20px;
  font-size:12px;font-weight:600;color:var(--muted);cursor:pointer;transition:all 0.18s;}
.pair-chip:hover,.pair-chip.active{background:rgba(0,229,180,0.1);border-color:var(--accent);color:var(--accent);}

/* Trends */
.trend-selector{margin-bottom:20px;}
.trend-form-grid{display:grid;grid-template-columns:1fr auto 1fr 1fr;gap:16px;align-items:end;}
.trend-vs{font-size:10px;font-weight:800;letter-spacing:2px;color:var(--muted);text-align:center;padding-bottom:14px;}
.trend-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
.trend-stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;}
.tsc-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:6px;}
.tsc-value{font-size:18px;font-weight:800;font-family:var(--mono);}
.chart-card{}
.chart-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;}
.chart-title{font-size:20px;font-weight:900;}
.chart-sub{font-size:13px;color:var(--muted);margin-top:4px;}
.chart-badge{padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;}
.badge-up{background:rgba(0,229,180,0.12);color:var(--up);border:1px solid rgba(0,229,180,0.25);}
.badge-down{background:rgba(255,77,109,0.12);color:var(--down);border:1px solid rgba(255,77,109,0.25);}
.data-table-wrap{overflow-x:auto;max-height:400px;overflow-y:auto;}
.data-table{width:100%;border-collapse:collapse;font-size:13px;}
.data-table th{text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1px;
  color:var(--muted);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--surface);}
.data-table td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.03);}
.mono{font-family:var(--mono);}

/* Favorites Page */
.favorites-layout{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;}
.fav-list{display:flex;flex-direction:column;gap:10px;}
.fav-item{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--surface2);
  border:1px solid var(--border);border-radius:var(--radius);transition:border-color 0.2s;}
.fav-item:hover{border-color:var(--border-hover);}
.fav-flag-lg{font-size:26px;}
.fav-details{flex:1;}
.fav-code-lg{font-size:15px;font-weight:700;}
.fav-name-lg{font-size:12px;color:var(--muted);}
.fav-actions{display:flex;gap:8px;}
.search-input{margin-bottom:12px;}
.currency-browser{max-height:500px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;}
.currency-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--radius-sm);transition:background 0.15s;}
.currency-item:hover{background:var(--surface2);}
.currency-item.is-fav{opacity:0.55;}
.ci-flag{font-size:20px;}
.ci-info{flex:1;}
.ci-code{font-size:13px;font-weight:700;}
.ci-name{font-size:11px;color:var(--muted);}
.fav-badge{font-size:11px;color:var(--accent);background:rgba(0,229,180,0.1);padding:4px 10px;border-radius:20px;font-weight:700;}

/* Buttons */
.btn-sm{padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;font-family:var(--font);
  cursor:pointer;transition:all 0.15s;border:1px solid;}
.btn-outline{background:transparent;border-color:var(--border);color:var(--muted);}
.btn-outline:hover{border-color:var(--accent);color:var(--accent);}
.btn-danger{background:rgba(255,77,109,0.1);border-color:rgba(255,77,109,0.3);color:var(--down);}
.btn-danger:hover{background:rgba(255,77,109,0.2);}
.btn-add{background:rgba(0,229,180,0.1);border-color:rgba(0,229,180,0.3);color:var(--accent);}
.btn-add:hover{background:rgba(0,229,180,0.2);}

/* Empty State */
.empty-state{text-align:center;padding:48px 24px;}
.empty-icon{font-size:48px;margin-bottom:14px;}
.empty-title{font-size:16px;font-weight:700;margin-bottom:8px;}
.empty-sub{font-size:14px;color:var(--muted);}

/* Notifications Page */
.notif-layout{display:flex;flex-direction:column;gap:20px;}
.alert-form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
.alerts-list{display:flex;flex-direction:column;gap:12px;}
.alert-item{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:18px 20px;}
.alert-item.triggered{border-color:rgba(0,229,180,0.2);opacity:0.7;}
.alert-pair{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.alert-currencies{font-size:18px;font-weight:900;font-family:var(--mono);}
.alert-status{font-size:10px;font-weight:700;letter-spacing:1px;}
.status-active{color:var(--up);}
.status-triggered{color:var(--muted);}
.alert-condition{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.cond-badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;}
.cond-above{background:rgba(0,229,180,0.1);color:var(--up);}
.cond-below{background:rgba(255,77,109,0.1);color:var(--down);}
.cond-rate{font-family:var(--mono);font-size:16px;font-weight:700;}
.alert-meta{font-size:12px;color:var(--muted);margin-bottom:12px;}
.log-list{display:flex;flex-direction:column;gap:2px;}
.log-item{display:flex;align-items:flex-start;gap:12px;padding:14px 12px;border-radius:var(--radius-sm);
  transition:background 0.15s;position:relative;}
.log-item:hover{background:var(--surface2);}
.log-item.unread{background:rgba(0,229,180,0.04);}
.log-icon{font-size:18px;flex-shrink:0;}
.log-msg{font-size:13px;margin-bottom:4px;}
.log-time{font-size:11px;color:var(--muted);}
.unread-dot{position:absolute;right:12px;top:50%;transform:translateY(-50%);
  width:8px;height:8px;border-radius:50%;background:var(--accent);}

/* Responsive */
@media(max-width:900px){
  :root{--sidebar-w:64px;}
  .nav-label,.user-avatar+*{display:none;}
  .sidebar{padding:16px 8px;}
  .nav-link{justify-content:center;padding:12px;}
  .main-content{padding:20px;}
  .stats-strip,.dashboard-grid,.trend-stats{grid-template-columns:1fr 1fr;}
  .alert-form-grid{grid-template-columns:1fr 1fr;}
  .favorites-layout{grid-template-columns:1fr;}
  .trend-form-grid{grid-template-columns:1fr 1fr;}
  .trend-vs{display:none;}
}
@media(max-width:600px){
  .stats-strip,.dashboard-grid,.trend-stats,.alert-form-grid{grid-template-columns:1fr;}
  .converter-grid{grid-template-columns:1fr;}
  .conv-swap{display:none;}
  .auth-card{padding:28px 24px;}
  .form-row-2{grid-template-columns:1fr;}
}
```

---

### wwwroot/lib/signalr/signalr.min.js {#signalr}

```javascript
// SignalR stub for offline environments.
// Replace with: https://cdn.jsdelivr.net/npm/@microsoft/signalr@8.0.0/dist/browser/signalr.min.js
(function(){
  if(typeof signalR!=='undefined')return;
  window.signalR={
    HubConnectionBuilder:function(){
      return{
        withUrl:function(){return this;},
        build:function(){
          return{on:function(){},start:function(){return Promise.resolve();},invoke:function(){return Promise.resolve();}};
        }
      };
    }
  };
  console.info('SignalR stub active. Replace with real library for live notifications.');
})();
```

---

## 5. Part B: React Standalone Web App {#partB}

> No installation required. Just two files.

---

### index.html {#html}

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FXPulse — Exchange Rate App</title>
  <style>body{margin:0;background:#06080f;}</style>
</head>
<body>
  <div id="root"></div>
  <script type="importmap">
  {
    "imports": {
      "react":       "https://esm.sh/react@18",
      "react-dom":   "https://esm.sh/react-dom@18",
      "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
      "recharts":    "https://esm.sh/recharts@2"
    }
  }
  </script>
  <script type="module">
    import { createRoot } from 'react-dom';
    import App from './FXPulse.jsx';
    createRoot(document.getElementById('root')).render(App());
  </script>
</body>
</html>
```

> **Note:** The React standalone is best used via Claude's artifact renderer (the live preview from the previous response). For local use, the C# backend is the recommended approach.

---

## 6. How to Run {#howtorun}

### C# Backend (Recommended — Full Featured)

```bash
# Step 1: Install .NET 8 SDK
# Download from: https://dotnet.microsoft.com/download/dotnet/8

# Step 2: Create the project folder
mkdir FXPulse && cd FXPulse

# Step 3: Create the directory structure
mkdir -p Controllers Data Models Services
mkdir -p Views/{Account,Dashboard,Converter,Trends,Favorites,Notifications,Shared}
mkdir -p wwwroot/{css,lib/signalr}

# Step 4: Copy all files from Part A into their correct paths
# (ExchangeRateApp.csproj → root, Program.cs → root, etc.)

# Step 5: Restore NuGet packages
dotnet restore

# Step 6: Run
dotnet run

# Step 7: Open browser
open http://localhost:5000
```

**Demo credentials:**
| Field | Value |
|---|---|
| Email/Username | `demo` |
| Password | `demo123` |

---

### React Standalone (No Install — Browser Only)

1. Save `FXPulse.jsx` from above
2. Open the live preview artifact from the previous message in this conversation
3. Or serve locally: `npx serve .` and open `index.html`

**Demo credentials:**
| Field | Value |
|---|---|
| Username/Email | `demo` |
| Password | `demo123` |

---

## 7. Features Guide {#features}

### 🔐 Login & Register
- Login with email **or** username
- BCrypt hashed passwords (C# backend) / in-memory (React)
- "Remember me" for 30-day sessions
- Demo account pre-seeded

### 📊 Dashboard
- Live ticker scrolling across the top with all forex and crypto rates
- 4 stat cards: currencies tracked, crypto, favorites count, alerts
- Forex table: EUR/USD, GBP/USD, USD/JPY, USD/CAD, AUD/USD with sparklines
- Crypto table: BTC, ETH, BNB, SOL, XRP with market caps
- Star button on each pair to add to favorites instantly
- Favorites quick-strip at the bottom

### 💱 Converter
- 53+ currencies in dropdown (including BRL, HNL, GTQ, CRC, etc.)
- Real-time calculation as you type
- Swap button to reverse the pair
- Inverse rate shown automatically
- Quick reference table for 1, 5, 10, 25, 50, 100, 500, 1000 units
- Popular pair shortcuts: USD/EUR, BRL/HNL, EUR/BRL, etc.

### 📈 Trends
- Any pair from the 53 supported currencies
- 7 / 14 / 30 / 60 / 90 day period selector
- Area chart with Chart.js (C#) or Recharts (React)
- Stats: current rate, period change %, high, low
- Full sortable historical data table

### ★ Favorites
- Searchable currency browser (search by code or name)
- One-click add/remove
- Quick Convert and Trend links for each favorite
- Persisted to SQLite (C#) or localStorage (React)

### 🔔 Rate Alerts
- Set alerts: when pair goes **above** or **below** a target rate
- C# backend: background service checks every 60 seconds, pushes via SignalR
- React version: simulated check every 8 seconds
- Notification log with unread dot indicators
- Mark all read button

---

## 8. Connecting to Live APIs {#liveapis}

To use real market data instead of mock data, update `ExchangeRateService.cs`:

### Forex — ExchangeRate-API (Free tier available)

```csharp
// In GetTopForexRatesAsync() and GetRateAsync()
var client = _httpClientFactory.CreateClient();
var response = await client.GetStringAsync(
    $"https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/USD");
var data = JsonSerializer.Deserialize<ExchangeRateApiResponse>(response);
// Map data.conversion_rates to your rates dictionary
```

Sign up free at [exchangerate-api.com](https://www.exchangerate-api.com/)

### Crypto — CoinGecko (No API key needed)

```csharp
// In GetTopCryptoRatesAsync()
var url = "https://api.coingecko.com/api/v3/coins/markets"
        + "?vs_currency=usd&order=market_cap_desc&per_page=5&page=1";
var client = _httpClientFactory.CreateClient();
var json = await client.GetStringAsync(url);
// Parse and map to List<CryptoRate>
```

### Set UseMockData: false in appsettings.json

```json
"ExchangeRateApi": {
  "UseMockData": false,
  "ApiKey": "your_exchangerate_api_key_here"
}
```

---

*FXPulse — Built with C# ASP.NET Core 8, Entity Framework Core, SignalR, BCrypt, Chart.js, and React*
