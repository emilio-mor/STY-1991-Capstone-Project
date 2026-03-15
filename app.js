using OverdriveExchange.Data;
using OverdriveExchange.Models;
using Microsoft.EntityFrameworkCore;

namespace OverdriveExchange.Services;

// ─── Auth Service ─────────────────────────────────────────────────────────────

public class AuthService
{
    private readonly IDbContextFactory<AppDbContext> _fac;
    public int?    UserId   { get; private set; }
    public string? Username { get; private set; }
    public string? FullName { get; private set; }
    public bool    IsAuth   => UserId.HasValue;

    public event Action? OnChange;

    public AuthService(IDbContextFactory<AppDbContext> fac) => _fac = fac;

    public async Task<(bool ok, string err)> LoginAsync(string emailOrUser, string password)
    {
        await using var db = _fac.CreateDbContext();
        var user = await db.Users.FirstOrDefaultAsync(
            u => u.Email == emailOrUser || u.Username == emailOrUser);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return (false, "Invalid credentials. Try demo / demo123");

        user.LastLogin = DateTime.UtcNow;
        await db.SaveChangesAsync();

        UserId   = user.Id;
        Username = user.Username;
        FullName = user.FullName;
        OnChange?.Invoke();
        return (true, "");
    }

    public async Task<(bool ok, string err)> RegisterAsync(RegisterModel m)
    {
        await using var db = _fac.CreateDbContext();
        if (await db.Users.AnyAsync(u => u.Email == m.Email))
            return (false, "Email already registered.");
        if (await db.Users.AnyAsync(u => u.Username == m.Username))
            return (false, "Username already taken.");

        var user = new User
        {
            FullName     = m.FullName,
            Username     = m.Username,
            Email        = m.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(m.Password),
            CreatedAt    = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        UserId   = user.Id;
        Username = user.Username;
        FullName = user.FullName;
        OnChange?.Invoke();
        return (true, "");
    }

    public void Logout()
    {
        UserId = null; Username = null; FullName = null;
        OnChange?.Invoke();
    }
}

// ─── Exchange Rate Service ────────────────────────────────────────────────────

public interface IExchangeRateService
{
    List<CurrencyInfo>  GetAllCurrencies();
    List<ForexRate>     GetTopForex();
    List<CryptoRate>    GetTopCrypto();
    ConversionResult    Convert(string from, string to, double amount);
    TrendResult         GetTrend(string from, string to, int days);
    double              GetRate(string from, string to);
}

public class ExchangeRateService : IExchangeRateService
{
    private static readonly List<CurrencyInfo> _currencies = new()
    {
        new(){Code="USD",Name="US Dollar",          Flag="🇺🇸",Symbol="$"},
        new(){Code="EUR",Name="Euro",               Flag="🇪🇺",Symbol="€"},
        new(){Code="GBP",Name="British Pound",      Flag="🇬🇧",Symbol="£"},
        new(){Code="JPY",Name="Japanese Yen",       Flag="🇯🇵",Symbol="¥"},
        new(){Code="CAD",Name="Canadian Dollar",    Flag="🇨🇦",Symbol="CA$"},
        new(){Code="AUD",Name="Australian Dollar",  Flag="🇦🇺",Symbol="A$"},
        new(){Code="CHF",Name="Swiss Franc",        Flag="🇨🇭",Symbol="Fr"},
        new(){Code="CNY",Name="Chinese Yuan",       Flag="🇨🇳",Symbol="¥"},
        new(){Code="BRL",Name="Brazilian Real",     Flag="🇧🇷",Symbol="R$"},
        new(){Code="MXN",Name="Mexican Peso",       Flag="🇲🇽",Symbol="$"},
        new(){Code="INR",Name="Indian Rupee",       Flag="🇮🇳",Symbol="₹"},
        new(){Code="KRW",Name="South Korean Won",   Flag="🇰🇷",Symbol="₩"},
        new(){Code="SGD",Name="Singapore Dollar",   Flag="🇸🇬",Symbol="S$"},
        new(){Code="HKD",Name="Hong Kong Dollar",   Flag="🇭🇰",Symbol="HK$"},
        new(){Code="SEK",Name="Swedish Krona",      Flag="🇸🇪",Symbol="kr"},
        new(){Code="NOK",Name="Norwegian Krone",    Flag="🇳🇴",Symbol="kr"},
        new(){Code="DKK",Name="Danish Krone",       Flag="🇩🇰",Symbol="kr"},
        new(){Code="NZD",Name="New Zealand Dollar", Flag="🇳🇿",Symbol="NZ$"},
        new(){Code="ZAR",Name="South African Rand", Flag="🇿🇦",Symbol="R"},
        new(){Code="ARS",Name="Argentine Peso",     Flag="🇦🇷",Symbol="$"},
        new(){Code="CLP",Name="Chilean Peso",       Flag="🇨🇱",Symbol="$"},
        new(){Code="COP",Name="Colombian Peso",     Flag="🇨🇴",Symbol="$"},
        new(){Code="PEN",Name="Peruvian Sol",       Flag="🇵🇪",Symbol="S/."},
        new(){Code="HNL",Name="Honduran Lempira",   Flag="🇭🇳",Symbol="L"},
        new(){Code="GTQ",Name="Guatemalan Quetzal", Flag="🇬🇹",Symbol="Q"},
        new(){Code="CRC",Name="Costa Rican Colón",  Flag="🇨🇷",Symbol="₡"},
        new(){Code="DOP",Name="Dominican Peso",     Flag="🇩🇴",Symbol="RD$"},
        new(){Code="TRY",Name="Turkish Lira",       Flag="🇹🇷",Symbol="₺"},
        new(){Code="RUB",Name="Russian Ruble",      Flag="🇷🇺",Symbol="₽"},
        new(){Code="THB",Name="Thai Baht",          Flag="🇹🇭",Symbol="฿"},
        new(){Code="IDR",Name="Indonesian Rupiah",  Flag="🇮🇩",Symbol="Rp"},
        new(){Code="MYR",Name="Malaysian Ringgit",  Flag="🇲🇾",Symbol="RM"},
        new(){Code="PHP",Name="Philippine Peso",    Flag="🇵🇭",Symbol="₱"},
        new(){Code="VND",Name="Vietnamese Dong",    Flag="🇻🇳",Symbol="₫"},
        new(){Code="EGP",Name="Egyptian Pound",     Flag="🇪🇬",Symbol="£"},
        new(){Code="NGN",Name="Nigerian Naira",     Flag="🇳🇬",Symbol="₦"},
        new(){Code="KES",Name="Kenyan Shilling",    Flag="🇰🇪",Symbol="KSh"},
        new(){Code="GHS",Name="Ghanaian Cedi",      Flag="🇬🇭",Symbol="₵"},
        new(){Code="AED",Name="UAE Dirham",         Flag="🇦🇪",Symbol="د.إ"},
        new(){Code="SAR",Name="Saudi Riyal",        Flag="🇸🇦",Symbol="﷼"},
        new(){Code="ILS",Name="Israeli Shekel",     Flag="🇮🇱",Symbol="₪"},
        new(){Code="QAR",Name="Qatari Riyal",       Flag="🇶🇦",Symbol="﷼"},
        new(){Code="PKR",Name="Pakistani Rupee",    Flag="🇵🇰",Symbol="₨"},
        new(){Code="BDT",Name="Bangladeshi Taka",   Flag="🇧🇩",Symbol="৳"},
        new(){Code="UAH",Name="Ukrainian Hryvnia",  Flag="🇺🇦",Symbol="₴"},
        new(){Code="RON",Name="Romanian Leu",       Flag="🇷🇴",Symbol="lei"},
        new(){Code="HUF",Name="Hungarian Forint",   Flag="🇭🇺",Symbol="Ft"},
        new(){Code="CZK",Name="Czech Koruna",       Flag="🇨🇿",Symbol="Kč"},
        new(){Code="PLN",Name="Polish Zloty",       Flag="🇵🇱",Symbol="zł"},
        new(){Code="TWD",Name="Taiwanese Dollar",   Flag="🇹🇼",Symbol="NT$"},
        new(){Code="MAD",Name="Moroccan Dirham",    Flag="🇲🇦",Symbol="MAD"},
        new(){Code="JOD",Name="Jordanian Dinar",    Flag="🇯🇴",Symbol="JD"},
        new(){Code="KWD",Name="Kuwaiti Dinar",      Flag="🇰🇼",Symbol="KD"},
        new(){Code="OMR",Name="Omani Rial",         Flag="🇴🇲",Symbol="﷼"},
    };

    private static readonly Dictionary<string, double> _usd = new()
    {
        ["USD"]=1,      ["EUR"]=0.9221, ["GBP"]=0.7912, ["JPY"]=149.72, ["CAD"]=1.3621,
        ["AUD"]=1.5330, ["CHF"]=0.8821, ["CNY"]=7.2410, ["BRL"]=4.9620, ["MXN"]=17.124,
        ["INR"]=83.21,  ["KRW"]=1321.5, ["SGD"]=1.3421, ["HKD"]=7.8210, ["SEK"]=10.432,
        ["NOK"]=10.621, ["DKK"]=6.882,  ["NZD"]=1.643,  ["ZAR"]=18.921, ["ARS"]=873.5,
        ["CLP"]=924.3,  ["COP"]=3952.4, ["PEN"]=3.762,  ["HNL"]=24.71,  ["GTQ"]=7.801,
        ["CRC"]=520.12, ["DOP"]=58.42,  ["TRY"]=32.15,  ["RUB"]=91.25,  ["THB"]=35.12,
        ["IDR"]=15721,  ["MYR"]=4.712,  ["PHP"]=56.32,  ["VND"]=24870,  ["EGP"]=48.12,
        ["NGN"]=1570.4, ["KES"]=129.4,  ["GHS"]=14.21,  ["AED"]=3.6725, ["SAR"]=3.751,
        ["ILS"]=3.702,  ["QAR"]=3.641,  ["PKR"]=278.4,  ["BDT"]=110.12, ["UAH"]=39.21,
        ["RON"]=4.582,  ["HUF"]=357.1,  ["CZK"]=23.12,  ["PLN"]=4.012,  ["TWD"]=32.45,
        ["MAD"]=10.021, ["JOD"]=0.7092, ["KWD"]=0.3069, ["OMR"]=0.385,
    };

    public List<CurrencyInfo> GetAllCurrencies() => _currencies;

    public double GetRate(string from, string to)
    {
        var f = _usd.GetValueOrDefault(from.ToUpper(), 1);
        var t = _usd.GetValueOrDefault(to.ToUpper(), 1);
        return t / f;
    }

    public List<ForexRate> GetTopForex()
    {
        var pairs = new[] { ("EUR",+0.23), ("GBP",-0.14), ("JPY",+0.41), ("CAD",-0.07), ("AUD",+0.18) };
        return pairs.Select(p =>
        {
            var cur = _currencies.First(c => c.Code == p.Item1);
            return new ForexRate
            {
                BaseCurrency   = "USD", TargetCurrency = p.Item1,
                BaseName       = "US Dollar", TargetName = cur.Name,
                BaseFlag       = "🇺🇸", TargetFlag = cur.Flag,
                Rate           = Math.Round(GetRate("USD", p.Item1), 4),
                ChangePercent  = p.Item2,
                SparkData      = GenSpark("USD", p.Item1, 14)
            };
        }).ToList();
    }

    public List<CryptoRate> GetTopCrypto() => new()
    {
        new(){Symbol="BTC",Name="Bitcoin",  PriceUsd=67420.50,ChangePercent=+2.14,MarketCapBillions=1320,Icon="₿",Color="#F7931A"},
        new(){Symbol="ETH",Name="Ethereum", PriceUsd=3521.80, ChangePercent=+3.41,MarketCapBillions=423, Icon="Ξ",Color="#627EEA"},
        new(){Symbol="BNB",Name="BNB",      PriceUsd=598.30,  ChangePercent=+1.22,MarketCapBillions=87.5,Icon="⬡",Color="#F3BA2F"},
        new(){Symbol="SOL",Name="Solana",   PriceUsd=182.40,  ChangePercent=+5.67,MarketCapBillions=81.2,Icon="◎",Color="#9945FF"},
        new(){Symbol="XRP",Name="XRP",      PriceUsd=0.5921,  ChangePercent=+0.89,MarketCapBillions=33.4,Icon="✕",Color="#346AA9"},
    };

    public ConversionResult Convert(string from, string to, double amount)
    {
        from = from.ToUpper(); to = to.ToUpper();
        var rate  = GetRate(from, to);
        var fromC = _currencies.FirstOrDefault(c => c.Code == from);
        var toC   = _currencies.FirstOrDefault(c => c.Code == to);
        return new ConversionResult
        {
            FromCode = from, ToCode  = to,
            FromName = fromC?.Name ?? from, ToName = toC?.Name ?? to,
            FromFlag = fromC?.Flag ?? "🏳",  ToFlag = toC?.Flag ?? "🏳",
            Amount   = amount,
            Result   = Math.Round(amount * rate, 6),
            Rate     = Math.Round(rate, 6),
            Inverse  = Math.Round(1.0 / rate, 6),
        };
    }

    public TrendResult GetTrend(string from, string to, int days)
    {
        from = from.ToUpper(); to = to.ToUpper();
        var rate  = GetRate(from, to);
        var fromC = _currencies.FirstOrDefault(c => c.Code == from);
        var toC   = _currencies.FirstOrDefault(c => c.Code == to);
        var hist  = GenHistory(from, to, days, rate);
        var first = hist.First().Rate;
        return new TrendResult
        {
            Pair          = $"{from}/{to}",
            BaseName      = fromC?.Name ?? from, TargetName  = toC?.Name ?? to,
            BaseFlag      = fromC?.Flag ?? "🏳",  TargetFlag  = toC?.Flag ?? "🏳",
            CurrentRate   = Math.Round(rate, 6),
            ChangePercent = Math.Round((rate - first) / first * 100, 2),
            High          = hist.Max(h => h.Rate),
            Low           = hist.Min(h => h.Rate),
            History       = hist
        };
    }

    private List<double> GenSpark(string from, string to, int points)
    {
        var rate = GetRate(from, to);
        var rng  = new Random(from.GetHashCode() ^ to.GetHashCode());
        return Enumerable.Range(0, points)
            .Select(_ => rate + (rng.NextDouble() - 0.5) * rate * 0.02)
            .ToList();
    }

    private List<TrendPoint> GenHistory(string from, string to, int days, double rate)
    {
        var rng  = new Random(from.GetHashCode() ^ to.GetHashCode());
        var r    = rate * (1 + (rng.NextDouble() - 0.5) * 0.04);
        return Enumerable.Range(0, days + 1).Select(i =>
        {
            r += (rng.NextDouble() - 0.5) * rate * 0.01;
            return new TrendPoint
            {
                Label = DateTime.UtcNow.AddDays(i - days).ToString("MMM d"),
                Rate  = Math.Round(r, 6)
            };
        }).ToList();
    }
}

// ─── Favorites Service ────────────────────────────────────────────────────────

public interface IFavoritesService
{
    Task<List<FavoriteCurrency>> GetAsync(int userId);
    Task AddAsync(int userId, string code, string name, string flag);
    Task RemoveAsync(int userId, string code);
    Task<bool> IsFavoriteAsync(int userId, string code);
}

public class FavoritesService : IFavoritesService
{
    private readonly IDbContextFactory<AppDbContext> _fac;
    public FavoritesService(IDbContextFactory<AppDbContext> fac) => _fac = fac;

    public async Task<List<FavoriteCurrency>> GetAsync(int userId)
    {
        await using var db = _fac.CreateDbContext();
        return await db.FavoriteCurrencies
            .Where(f => f.UserId == userId)
            .OrderBy(f => f.AddedAt)
            .ToListAsync();
    }

    public async Task AddAsync(int userId, string code, string name, string flag)
    {
        await using var db = _fac.CreateDbContext();
        if (!await db.FavoriteCurrencies.AnyAsync(f => f.UserId == userId && f.CurrencyCode == code))
        {
            db.FavoriteCurrencies.Add(new FavoriteCurrency
            { UserId = userId, CurrencyCode = code, CurrencyName = name, Flag = flag });
            await db.SaveChangesAsync();
        }
    }

    public async Task RemoveAsync(int userId, string code)
    {
        await using var db = _fac.CreateDbContext();
        var fav = await db.FavoriteCurrencies
            .FirstOrDefaultAsync(f => f.UserId == userId && f.CurrencyCode == code);
        if (fav != null) { db.Remove(fav); await db.SaveChangesAsync(); }
    }

    public async Task<bool> IsFavoriteAsync(int userId, string code)
    {
        await using var db = _fac.CreateDbContext();
        return await db.FavoriteCurrencies.AnyAsync(f => f.UserId == userId && f.CurrencyCode == code);
    }
}

// ─── Alert Service ────────────────────────────────────────────────────────────

public interface IAlertService
{
    Task<List<RateAlert>>       GetAlertsAsync(int userId);
    Task<List<NotificationLog>> GetLogsAsync(int userId);
    Task<int>                   GetUnreadCountAsync(int userId);
    Task CreateAsync(int userId, CreateAlertModel m);
    Task DeleteAsync(int userId, int alertId);
    Task MarkAllReadAsync(int userId);
}

public class AlertService : IAlertService
{
    private readonly IDbContextFactory<AppDbContext> _fac;
    public AlertService(IDbContextFactory<AppDbContext> fac) => _fac = fac;

    public async Task<List<RateAlert>> GetAlertsAsync(int userId)
    {
        await using var db = _fac.CreateDbContext();
        return await db.RateAlerts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<NotificationLog>> GetLogsAsync(int userId)
    {
        await using var db = _fac.CreateDbContext();
        return await db.NotificationLogs
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        await using var db = _fac.CreateDbContext();
        return await db.NotificationLogs
            .CountAsync(l => l.UserId == userId && !l.IsRead);
    }

    public async Task CreateAsync(int userId, CreateAlertModel m)
    {
        await using var db = _fac.CreateDbContext();
        db.RateAlerts.Add(new RateAlert
        {
            UserId         = userId,
            BaseCurrency   = m.BaseCurrency.ToUpper(),
            TargetCurrency = m.TargetCurrency.ToUpper(),
            TargetRate     = m.TargetRate,
            Condition      = m.Condition,
            IsActive       = true,
            CreatedAt      = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int userId, int alertId)
    {
        await using var db = _fac.CreateDbContext();
        var a = await db.RateAlerts.FirstOrDefaultAsync(a => a.Id == alertId && a.UserId == userId);
        if (a != null) { db.Remove(a); await db.SaveChangesAsync(); }
    }

    public async Task MarkAllReadAsync(int userId)
    {
        await using var db = _fac.CreateDbContext();
        var logs = await db.NotificationLogs.Where(l => l.UserId == userId && !l.IsRead).ToListAsync();
        logs.ForEach(l => l.IsRead = true);
        await db.SaveChangesAsync();
    }
}

// ─── Alert Monitor (Background Service) ──────────────────────────────────────

public class AlertMonitorService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<AlertMonitorService> _log;

    public AlertMonitorService(IServiceProvider services, ILogger<AlertMonitorService> log)
    { _services = services; _log = log; }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var fac  = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AppDbContext>>();
                var rates = scope.ServiceProvider.GetRequiredService<IExchangeRateService>();

                await using var db = fac.CreateDbContext();
                var active = await db.RateAlerts
                    .Where(a => a.IsActive && !a.IsTriggered)
                    .ToListAsync(ct);

                foreach (var alert in active)
                {
                    var cur       = rates.GetRate(alert.BaseCurrency, alert.TargetCurrency);
                    var triggered = alert.Condition == AlertCondition.Above
                        ? cur >= alert.TargetRate
                        : cur <= alert.TargetRate;

                    if (triggered)
                    {
                        alert.IsTriggered = true;
                        alert.TriggeredAt = DateTime.UtcNow;
                        var verb = alert.Condition == AlertCondition.Above ? "risen above" : "dropped below";
                        db.NotificationLogs.Add(new NotificationLog
                        {
                            UserId    = alert.UserId,
                            Message   = $"{alert.BaseCurrency}/{alert.TargetCurrency} has {verb} {alert.TargetRate:F4}. Current: {cur:F4}",
                            Pair      = $"{alert.BaseCurrency}/{alert.TargetCurrency}",
                            IsRead    = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
                await db.SaveChangesAsync(ct);
            }
            catch (Exception ex) { _log.LogError(ex, "AlertMonitor error"); }

            await Task.Delay(TimeSpan.FromMinutes(1), ct);
        }
    }
}
