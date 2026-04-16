using OverdriveExchange.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OverdriveExchange.Services;

// ─── Crypto Cache (singleton) ─────────────────────────────────────────────────

public class CryptoCache
{
    private List<CryptoRate> _rates = new();
    private DateTime         _lastFetch = DateTime.MinValue;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public bool            IsStale   => DateTime.UtcNow - _lastFetch > TimeSpan.FromMinutes(5);
    public bool            HasRates  => _rates.Count > 0;
    public List<CryptoRate> Rates    => _rates;
    public DateTime         LastFetch => _lastFetch;
    public SemaphoreSlim    Lock     => _lock;

    public void Set(List<CryptoRate> rates)
    {
        _rates     = rates;
        _lastFetch = DateTime.UtcNow;
    }
}

// ─── CoinGecko Service ────────────────────────────────────────────────────────
// Attribution requirement: Display "Data powered by CoinGecko" with link
// See: https://brand.coingecko.com/resources/attribution-guide

public interface ICryptoService
{
    Task<List<CryptoRate>> GetTopCryptoAsync();
    Task                   RefreshAsync();
}

public class CryptoService : ICryptoService
{
    private readonly HttpClient   _http;
    private readonly CryptoCache  _cache;
    private readonly IConfiguration _config;
    private readonly ILogger<CryptoService> _log;

    // Static metadata for the 5 tracked coins
    private static readonly Dictionary<string, (string Icon, string Color)> _meta = new()
    {
        ["bitcoin"]  = ("₿",  "#F7931A"),
        ["ethereum"] = ("Ξ",  "#627EEA"),
        ["binancecoin"] = ("⬡", "#F3BA2F"),
        ["solana"]   = ("◎",  "#9945FF"),
        ["ripple"]   = ("✕",  "#346AA9"),
    };

    // Fallback data shown when API is unavailable
    private static readonly List<CryptoRate> _fallback = new()
    {
        new(){Symbol="BTC",Name="Bitcoin",    CoinGeckoId="bitcoin",     Icon="₿", Color="#F7931A",PriceUsd=0,ChangePercent24h=0,MarketCapBillions=0},
        new(){Symbol="ETH",Name="Ethereum",   CoinGeckoId="ethereum",    Icon="Ξ", Color="#627EEA",PriceUsd=0,ChangePercent24h=0,MarketCapBillions=0},
        new(){Symbol="BNB",Name="BNB",        CoinGeckoId="binancecoin", Icon="⬡", Color="#F3BA2F",PriceUsd=0,ChangePercent24h=0,MarketCapBillions=0},
        new(){Symbol="SOL",Name="Solana",     CoinGeckoId="solana",      Icon="◎", Color="#9945FF",PriceUsd=0,ChangePercent24h=0,MarketCapBillions=0},
        new(){Symbol="XRP",Name="XRP",        CoinGeckoId="ripple",      Icon="✕", Color="#346AA9",PriceUsd=0,ChangePercent24h=0,MarketCapBillions=0},
    };

    public CryptoService(HttpClient http, CryptoCache cache,
        IConfiguration config, ILogger<CryptoService> log)
    {
        _http = http; _cache = cache; _config = config; _log = log;
        _http.Timeout = TimeSpan.FromSeconds(10);
    }

    public async Task<List<CryptoRate>> GetTopCryptoAsync()
    {
        await RefreshAsync();
        return _cache.HasRates ? _cache.Rates : _fallback;
    }

    public async Task RefreshAsync()
    {
        if (!_cache.IsStale) return;

        await _cache.Lock.WaitAsync();
        try
        {
            if (!_cache.IsStale) return;

            var apiKey  = _config["CoinGecko:ApiKey"] ?? "";
            var baseUrl = _config["CoinGecko:BaseUrl"] ?? "https://api.coingecko.com/api/v3";
            var ids     = string.Join(",", _meta.Keys);

            // CoinGecko /coins/markets endpoint — returns price, 24h change, market cap, volume
            var url = $"{baseUrl}/coins/markets" +
                      $"?vs_currency=usd" +
                      $"&ids={ids}" +
                      $"&order=market_cap_desc" +
                      $"&per_page=5" +
                      $"&page=1" +
                      $"&sparkline=false" +
                      $"&price_change_percentage=24h" +
                      $"&x_cg_demo_api_key={apiKey}";

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            // Also send via header as per CoinGecko docs
            if (!string.IsNullOrEmpty(apiKey))
                request.Headers.Add("x-cg-demo-api-key", apiKey);

            var response = await _http.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json  = await response.Content.ReadAsStringAsync();
            var items = JsonSerializer.Deserialize<List<CoinGeckoMarket>>(json)
                        ?? new List<CoinGeckoMarket>();

            var rates = items.Select(item =>
            {
                var (icon, color) = _meta.GetValueOrDefault(item.Id, ("●", "#888"));
                return new CryptoRate
                {
                    CoinGeckoId       = item.Id,
                    Symbol            = item.Symbol.ToUpper(),
                    Name              = item.Name,
                    PriceUsd          = item.CurrentPrice,
                    ChangePercent24h  = item.PriceChangePercentage24h,
                    MarketCapBillions = Math.Round(item.MarketCap / 1_000_000_000.0, 1),
                    Volume24hBillions = Math.Round(item.TotalVolume / 1_000_000_000.0, 2),
                    ImageUrl          = item.Image ?? "",
                    Icon              = icon,
                    Color             = color,
                };
            }).ToList();

            _cache.Set(rates);
            _log.LogInformation("CoinGecko rates refreshed at {Time}", DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "CoinGecko API call failed; keeping cached or fallback data.");
            if (!_cache.HasRates) _cache.Set(_fallback);
        }
        finally { _cache.Lock.Release(); }
    }

    // ── CoinGecko API response model ──────────────────────────────────────────

    private class CoinGeckoMarket
    {
        [JsonPropertyName("id")]                              public string Id                       { get; set; } = "";
        [JsonPropertyName("symbol")]                          public string Symbol                   { get; set; } = "";
        [JsonPropertyName("name")]                            public string Name                     { get; set; } = "";
        [JsonPropertyName("image")]                           public string? Image                   { get; set; }
        [JsonPropertyName("current_price")]                   public double CurrentPrice             { get; set; }
        [JsonPropertyName("market_cap")]                      public double MarketCap                { get; set; }
        [JsonPropertyName("total_volume")]                    public double TotalVolume              { get; set; }
        [JsonPropertyName("price_change_percentage_24h")]     public double PriceChangePercentage24h { get; set; }
        [JsonPropertyName("market_cap_rank")]                 public int    MarketCapRank            { get; set; }
    }
}
