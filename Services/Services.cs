using OverdriveExchange.Data;
using OverdriveExchange.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OverdriveExchange.Services;

// ─── Auth ─────────────────────────────────────────────────────────────────────

public class AuthService
{
    private readonly IHttpContextAccessor _http;
    private readonly IDbContextFactory<AppDbContext> _db;

    public AuthService(IHttpContextAccessor http, IDbContextFactory<AppDbContext> db)
        => (_http, _db) = (http, db);

    private System.Security.Claims.ClaimsPrincipal? Principal => _http.HttpContext?.User;

    public bool    IsAuth   => Principal?.Identity?.IsAuthenticated == true;
    public int?    UserId   => IsAuth ? int.Parse(Principal!.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value) : null;
    public string? Username => Principal?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
    public string? FullName => Principal?.FindFirst("FullName")?.Value;

    public async Task<(bool ok, string err, int id)> RegisterAsync(RegisterModel m)
    {
        await using var db = _db.CreateDbContext();
        if (await db.Users.AnyAsync(u => u.Email == m.Email))     return (false, "Email already registered.", 0);
        if (await db.Users.AnyAsync(u => u.Username == m.Username)) return (false, "Username already taken.", 0);

        var user = new User { FullName=m.FullName, Username=m.Username, Email=m.Email,
            PasswordHash=BCrypt.Net.BCrypt.HashPassword(m.Password) };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return (true, "", user.Id);
    }
}

// ─── Rate Cache (singleton — shared across all users) ─────────────────────────

public class RateCache
{
    private Dictionary<string, double> _rates = new();
    private DateTime _lastFetch = DateTime.MinValue;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public bool  IsStale  => DateTime.UtcNow - _lastFetch > TimeSpan.FromMinutes(10);
    public bool  HasRates => _rates.Count > 0;

    public double Get(string from, string to)
    {
        var f = _rates.GetValueOrDefault(from.ToUpper(), 1);
        var t = _rates.GetValueOrDefault(to.ToUpper(), 1);
        return f == 0 ? 0 : t / f;
    }

    public void Set(Dictionary<string, double> rates)
    {
        _rates     = rates;
        _lastFetch = DateTime.UtcNow;
    }

    public SemaphoreSlim Lock => _lock;
    public DateTime LastFetch => _lastFetch;
}

// ─── Exchange Rate Service — live data from exchangerate.host ─────────────────

public interface IExchangeRateService
{
    List<CurrencyInfo>       GetAllCurrencies();
    Task<List<ForexRate>>    GetTopForexAsync();
    // Crypto moved to ICryptoService / CryptoService
    Task<ConversionResult>   ConvertAsync(string from, string to, double amount);
    Task<TrendResult>        GetTrendAsync(string from, string to, int days);
    Task<double>             GetRateAsync(string from, string to);
    Task                     RefreshRatesAsync();
}

public class ExchangeRateService : IExchangeRateService
{
    private readonly HttpClient   _http;
    private readonly RateCache    _cache;
    private readonly IConfiguration _config;
    private readonly ILogger<ExchangeRateService> _log;

    // Complete currency metadata — code, name, flag emoji, symbol
    private static readonly List<CurrencyInfo> _currencies = new()
    {
        new("USD","US Dollar",          "🇺🇸","$"),   new("EUR","Euro",               "🇪🇺","€"),
        new("GBP","British Pound",      "🇬🇧","£"),   new("JPY","Japanese Yen",       "🇯🇵","¥"),
        new("CAD","Canadian Dollar",    "🇨🇦","CA$"),  new("AUD","Australian Dollar",  "🇦🇺","A$"),
        new("CHF","Swiss Franc",        "🇨🇭","Fr"),   new("CNY","Chinese Yuan",       "🇨🇳","¥"),
        new("BRL","Brazilian Real",     "🇧🇷","R$"),   new("MXN","Mexican Peso",       "🇲🇽","$"),
        new("INR","Indian Rupee",       "🇮🇳","₹"),   new("KRW","South Korean Won",   "🇰🇷","₩"),
        new("SGD","Singapore Dollar",   "🇸🇬","S$"),   new("HKD","Hong Kong Dollar",   "🇭🇰","HK$"),
        new("SEK","Swedish Krona",      "🇸🇪","kr"),   new("NOK","Norwegian Krone",    "🇳🇴","kr"),
        new("DKK","Danish Krone",       "🇩🇰","kr"),   new("NZD","New Zealand Dollar", "🇳🇿","NZ$"),
        new("ZAR","South African Rand", "🇿🇦","R"),    new("ARS","Argentine Peso",     "🇦🇷","$"),
        new("CLP","Chilean Peso",       "🇨🇱","$"),    new("COP","Colombian Peso",     "🇨🇴","$"),
        new("PEN","Peruvian Sol",       "🇵🇪","S/."),  new("HNL","Honduran Lempira",   "🇭🇳","L"),
        new("GTQ","Guatemalan Quetzal", "🇬🇹","Q"),    new("CRC","Costa Rican Colón",  "🇨🇷","₡"),
        new("DOP","Dominican Peso",     "🇩🇴","RD$"),  new("TRY","Turkish Lira",       "🇹🇷","₺"),
        new("RUB","Russian Ruble",      "🇷🇺","₽"),   new("THB","Thai Baht",          "🇹🇭","฿"),
        new("IDR","Indonesian Rupiah",  "🇮🇩","Rp"),   new("MYR","Malaysian Ringgit",  "🇲🇾","RM"),
        new("PHP","Philippine Peso",    "🇵🇭","₱"),   new("VND","Vietnamese Dong",    "🇻🇳","₫"),
        new("EGP","Egyptian Pound",     "🇪🇬","£"),    new("NGN","Nigerian Naira",     "🇳🇬","₦"),
        new("KES","Kenyan Shilling",    "🇰🇪","KSh"),  new("GHS","Ghanaian Cedi",      "🇬🇭","₵"),
        new("AED","UAE Dirham",         "🇦🇪","د.إ"),  new("SAR","Saudi Riyal",        "🇸🇦","﷼"),
        new("ILS","Israeli Shekel",     "🇮🇱","₪"),   new("QAR","Qatari Riyal",       "🇶🇦","﷼"),
        new("PKR","Pakistani Rupee",    "🇵🇰","₨"),   new("BDT","Bangladeshi Taka",   "🇧🇩","৳"),
        new("UAH","Ukrainian Hryvnia",  "🇺🇦","₴"),   new("RON","Romanian Leu",       "🇷🇴","lei"),
        new("HUF","Hungarian Forint",   "🇭🇺","Ft"),   new("CZK","Czech Koruna",       "🇨🇿","Kč"),
        new("PLN","Polish Zloty",       "🇵🇱","zł"),  new("TWD","Taiwanese Dollar",   "🇹🇼","NT$"),
        new("MAD","Moroccan Dirham",    "🇲🇦","MAD"),  new("JOD","Jordanian Dinar",    "🇯🇴","JD"),
        new("KWD","Kuwaiti Dinar",      "🇰🇼","KD"),   new("OMR","Omani Rial",         "🇴🇲","﷼"),
    };

    // Fallback rates used when API is unavailable
    private static readonly Dictionary<string, double> _fallback = new()
    {
        ["USD"]=1, ["EUR"]=0.922, ["GBP"]=0.791, ["JPY"]=149.7, ["CAD"]=1.362,
        ["AUD"]=1.533,["CHF"]=0.882,["CNY"]=7.241,["BRL"]=4.962,["MXN"]=17.12,
        ["INR"]=83.21,["KRW"]=1321.0,["SGD"]=1.342,["HKD"]=7.821,["SEK"]=10.43,
        ["NOK"]=10.62,["DKK"]=6.882,["NZD"]=1.643,["ZAR"]=18.92,["ARS"]=873.0,
        ["CLP"]=924.0,["COP"]=3952.0,["PEN"]=3.762,["HNL"]=24.71,["GTQ"]=7.801,
        ["CRC"]=520.0,["DOP"]=58.42,["TRY"]=32.15,["RUB"]=91.25,["THB"]=35.12,
        ["IDR"]=15721.0,["MYR"]=4.712,["PHP"]=56.32,["VND"]=24870.0,["EGP"]=48.12,
        ["NGN"]=1570.0,["KES"]=129.4,["GHS"]=14.21,["AED"]=3.672,["SAR"]=3.751,
        ["ILS"]=3.702,["QAR"]=3.641,["PKR"]=278.4,["BDT"]=110.1,["UAH"]=39.21,
        ["RON"]=4.582,["HUF"]=357.1,["CZK"]=23.12,["PLN"]=4.012,["TWD"]=32.45,
        ["MAD"]=10.02,["JOD"]=0.709,["KWD"]=0.307,["OMR"]=0.385,
    };

    public ExchangeRateService(HttpClient http, RateCache cache,
        IConfiguration config, ILogger<ExchangeRateService> log)
    {
        _http = http; _cache = cache; _config = config; _log = log;
        _http.Timeout = TimeSpan.FromSeconds(10);
    }

    public List<CurrencyInfo> GetAllCurrencies() => _currencies;

    // ── Fetch all rates from API (base=USD) ───────────────────────────────────
    public async Task RefreshRatesAsync()
    {
        if (!_cache.IsStale) return;

        await _cache.Lock.WaitAsync();
        try
        {
            if (!_cache.IsStale) return; // double-check after acquiring lock

            var key     = _config["ExchangeRates:ApiKey"] ?? "";
            var baseUrl = _config["ExchangeRates:BaseUrl"] ?? "https://api.exchangerate.host";

            // exchangerate.host free endpoint — returns all rates vs USD
            var url  = $"{baseUrl}/live?access_key={key}&source=USD";
            var json = await _http.GetStringAsync(url);
            var resp = JsonSerializer.Deserialize<ExchangeRateHostResponse>(json);

            if (resp?.Success == true && resp.Quotes?.Count > 0)
            {
                // API returns keys like "USDEUR", strip the "USD" prefix
                var rates = resp.Quotes
                    .ToDictionary(
                        kv => kv.Key.Length >= 6 ? kv.Key[3..] : kv.Key,
                        kv => kv.Value);
                rates["USD"] = 1.0;
                _cache.Set(rates);
                _log.LogInformation("Rates refreshed from API at {Time}", DateTime.UtcNow);
            }
            else
            {
                _log.LogWarning("API returned no data; using fallback rates.");
                _cache.Set(_fallback);
            }
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Rate API call failed; using fallback rates.");
            if (!_cache.HasRates) _cache.Set(_fallback);
        }
        finally { _cache.Lock.Release(); }
    }

    public async Task<double> GetRateAsync(string from, string to)
    {
        await RefreshRatesAsync();
        return _cache.Get(from.ToUpper(), to.ToUpper());
    }

    public async Task<List<ForexRate>> GetTopForexAsync()
    {
        await RefreshRatesAsync();
        var targets = new[] { "EUR","GBP","JPY","CAD","AUD" };
        return targets.Select(code =>
        {
            var cur  = _currencies.First(c => c.Code == code);
            var rate = _cache.Get("USD", code);
            return new ForexRate
            {
                BaseCurrency   = "USD", TargetCurrency = code,
                TargetName     = cur.Name,
                BaseFlag       = "🇺🇸", TargetFlag = cur.Flag,
                Rate           = Math.Round(rate, 4),
                ChangePercent  = 0,           // live change requires yesterday's rate
                SparkData      = BuildFlatSpark(rate)
            };
        }).ToList();
    }

    // Crypto data is provided by CryptoService (CoinGecko API)

    public async Task<ConversionResult> ConvertAsync(string from, string to, double amount)
    {
        from = from.ToUpper(); to = to.ToUpper();
        await RefreshRatesAsync();
        var rate  = _cache.Get(from, to);
        var fromC = _currencies.FirstOrDefault(c => c.Code == from);
        var toC   = _currencies.FirstOrDefault(c => c.Code == to);
        return new ConversionResult
        {
            FromCode = from,    ToCode  = to,
            FromName = fromC?.Name ?? from, ToName = toC?.Name ?? to,
            FromFlag = fromC?.Flag ?? "🏳", ToFlag = toC?.Flag ?? "🏳",
            Amount   = amount,
            Result   = Math.Round(amount * rate, 6),
            Rate     = Math.Round(rate, 6),
            Inverse  = rate > 0 ? Math.Round(1.0 / rate, 6) : 0,
        };
    }

    public async Task<TrendResult> GetTrendAsync(string from, string to, int days)
    {
        from = from.ToUpper(); to = to.ToUpper();
        await RefreshRatesAsync();
        var rate  = _cache.Get(from, to);
        var fromC = _currencies.FirstOrDefault(c => c.Code == from);
        var toC   = _currencies.FirstOrDefault(c => c.Code == to);

        // Simulated history around the live rate (API historical requires paid plan)
        var hist  = SimulateHistory(rate, days, from, to);
        var first = hist.First().Rate;

        return new TrendResult
        {
            Pair          = $"{from}/{to}",
            BaseName      = fromC?.Name ?? from, TargetName  = toC?.Name ?? to,
            BaseFlag      = fromC?.Flag ?? "🏳",  TargetFlag  = toC?.Flag ?? "🏳",
            CurrentRate   = Math.Round(rate, 6),
            ChangePercent = first > 0 ? Math.Round((rate - first) / first * 100, 2) : 0,
            High          = hist.Max(h => h.Rate),
            Low           = hist.Min(h => h.Rate),
            History       = hist
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static List<double> BuildFlatSpark(double rate)
    {
        var rng = new Random();
        return Enumerable.Range(0, 14)
            .Select(_ => rate * (1 + (rng.NextDouble() - 0.5) * 0.004))
            .ToList();
    }

    private static List<TrendPoint> SimulateHistory(double currentRate, int days, string from, string to)
    {
        var rng  = new Random(from.GetHashCode() ^ to.GetHashCode());
        var r    = currentRate * (1 + (rng.NextDouble() - 0.5) * 0.04);
        return Enumerable.Range(0, days + 1).Select(i =>
        {
            r += (rng.NextDouble() - 0.5) * currentRate * 0.008;
            return new TrendPoint
            {
                Label = DateTime.UtcNow.AddDays(i - days).ToString("MMM d"),
                Rate  = Math.Round(Math.Max(r, 0.0001), 6)
            };
        }).ToList();
    }

    // ── API response model ────────────────────────────────────────────────────

    private class ExchangeRateHostResponse
    {
        [JsonPropertyName("success")]  public bool Success { get; set; }
        [JsonPropertyName("quotes")]   public Dictionary<string, double>? Quotes { get; set; }
    }
}

// ─── Favorites Service ────────────────────────────────────────────────────────

public interface IFavoritesService
{
    Task<List<FavoriteCurrency>> GetAsync(int userId);
    Task AddAsync(int userId, string code, string name, string flag);
    Task RemoveAsync(int userId, string code);
}

public class FavoritesService : IFavoritesService
{
    private readonly IDbContextFactory<AppDbContext> _db;
    public FavoritesService(IDbContextFactory<AppDbContext> db) => _db = db;

    public async Task<List<FavoriteCurrency>> GetAsync(int userId)
    {
        await using var db = _db.CreateDbContext();
        return await db.FavoriteCurrencies.Where(f => f.UserId == userId).OrderBy(f => f.AddedAt).ToListAsync();
    }

    public async Task AddAsync(int userId, string code, string name, string flag)
    {
        await using var db = _db.CreateDbContext();
        if (!await db.FavoriteCurrencies.AnyAsync(f => f.UserId == userId && f.CurrencyCode == code))
        {
            db.FavoriteCurrencies.Add(new FavoriteCurrency { UserId=userId, CurrencyCode=code, CurrencyName=name, Flag=flag });
            await db.SaveChangesAsync();
        }
    }

    public async Task RemoveAsync(int userId, string code)
    {
        await using var db = _db.CreateDbContext();
        var f = await db.FavoriteCurrencies.FirstOrDefaultAsync(f => f.UserId == userId && f.CurrencyCode == code);
        if (f != null) { db.Remove(f); await db.SaveChangesAsync(); }
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
    private readonly IDbContextFactory<AppDbContext> _db;
    public AlertService(IDbContextFactory<AppDbContext> db) => _db = db;

    public async Task<List<RateAlert>> GetAlertsAsync(int userId)
    {
        await using var db = _db.CreateDbContext();
        return await db.RateAlerts.Where(a => a.UserId == userId).OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<List<NotificationLog>> GetLogsAsync(int userId)
    {
        await using var db = _db.CreateDbContext();
        return await db.NotificationLogs.Where(l => l.UserId == userId).OrderByDescending(l => l.CreatedAt).Take(50).ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        await using var db = _db.CreateDbContext();
        return await db.NotificationLogs.CountAsync(l => l.UserId == userId && !l.IsRead);
    }

    public async Task CreateAsync(int userId, CreateAlertModel m)
    {
        await using var db = _db.CreateDbContext();
        db.RateAlerts.Add(new RateAlert
        {
            UserId = userId, BaseCurrency = m.BaseCurrency.ToUpper(),
            TargetCurrency = m.TargetCurrency.ToUpper(), TargetRate = m.TargetRate,
            Condition = m.Condition, IsActive = true, CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int userId, int alertId)
    {
        await using var db = _db.CreateDbContext();
        var a = await db.RateAlerts.FirstOrDefaultAsync(a => a.Id == alertId && a.UserId == userId);
        if (a != null) { db.Remove(a); await db.SaveChangesAsync(); }
    }

    public async Task MarkAllReadAsync(int userId)
    {
        await using var db = _db.CreateDbContext();
        var logs = await db.NotificationLogs.Where(l => l.UserId == userId && !l.IsRead).ToListAsync();
        logs.ForEach(l => l.IsRead = true);
        await db.SaveChangesAsync();
    }
}

// ─── Alert Monitor ────────────────────────────────────────────────────────────

public class AlertMonitorService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<AlertMonitorService> _log;
    public AlertMonitorService(IServiceProvider sp, ILogger<AlertMonitorService> log) => (_sp, _log) = (sp, log);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var rates = scope.ServiceProvider.GetRequiredService<IExchangeRateService>();
                var fac   = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AppDbContext>>();

                await using var db = fac.CreateDbContext();
                var active = await db.RateAlerts.Where(a => a.IsActive && !a.IsTriggered).ToListAsync(ct);

                foreach (var alert in active)
                {
                    var cur       = await rates.GetRateAsync(alert.BaseCurrency, alert.TargetCurrency);
                    var triggered = alert.Condition == AlertCondition.Above ? cur >= alert.TargetRate : cur <= alert.TargetRate;
                    if (!triggered) continue;

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
                await db.SaveChangesAsync(ct);
            }
            catch (Exception ex) { _log.LogError(ex, "AlertMonitor error"); }
            await Task.Delay(TimeSpan.FromMinutes(1), ct);
        }
    }
}
