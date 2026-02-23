using ExchangeRateApp.Models;
using ExchangeRateApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ExchangeRateApp.Controllers;

// ─── Dashboard ────────────────────────────────────────────────────────────────

[Authorize]
public class DashboardController : Controller
{
    private readonly IExchangeRateService _rateService;
    private readonly INotificationService _notifService;

    public DashboardController(IExchangeRateService rateService, INotificationService notifService)
    {
        _rateService = rateService;
        _notifService = notifService;
    }

    public async Task<IActionResult> Index()
    {
        var userId = GetUserId();
        var vm = new DashboardViewModel
        {
            TopForex = await _rateService.GetTopForexRatesAsync(),
            TopCrypto = await _rateService.GetTopCryptoRatesAsync(),
            Favorites = await _notifService.GetFavoritesAsync(userId),
            UnreadNotifications = await _notifService.GetUnreadCountAsync(userId),
            LastUpdated = DateTime.UtcNow
        };
        return View(vm);
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}

// ─── Converter ────────────────────────────────────────────────────────────────

[Authorize]
public class ConverterController : Controller
{
    private readonly IExchangeRateService _rateService;
    private readonly INotificationService _notifService;

    public ConverterController(IExchangeRateService rateService, INotificationService notifService)
    {
        _rateService = rateService;
        _notifService = notifService;
    }

    public async Task<IActionResult> Index(string from = "USD", string to = "EUR", double amount = 1)
    {
        ViewBag.UnreadCount = await _notifService.GetUnreadCountAsync(GetUserId());
        var vm = new ConverterViewModel
        {
            AllCurrencies = _rateService.GetAllCurrencies(),
            FromCurrency = from.ToUpper(),
            ToCurrency = to.ToUpper(),
            Amount = amount
        };

        if (amount > 0)
            vm.Result = await _rateService.ConvertAsync(from, to, amount);

        return View(vm);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Convert(string from, string to, double amount)
    {
        ViewBag.UnreadCount = await _notifService.GetUnreadCountAsync(GetUserId());
        var vm = new ConverterViewModel
        {
            AllCurrencies = _rateService.GetAllCurrencies(),
            FromCurrency = from?.ToUpper() ?? "USD",
            ToCurrency = to?.ToUpper() ?? "EUR",
            Amount = amount,
            Result = await _rateService.ConvertAsync(from ?? "USD", to ?? "EUR", amount)
        };
        return View("Index", vm);
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}

// ─── Trends ──────────────────────────────────────────────────────────────────

[Authorize]
public class TrendsController : Controller
{
    private readonly IExchangeRateService _rateService;
    private readonly INotificationService _notifService;

    public TrendsController(IExchangeRateService rateService, INotificationService notifService)
    {
        _rateService = rateService;
        _notifService = notifService;
    }

    public async Task<IActionResult> Index(string @base = "USD", string target = "EUR", int days = 30)
    {
        ViewBag.UnreadCount = await _notifService.GetUnreadCountAsync(GetUserId());
        ViewBag.AllCurrencies = _rateService.GetAllCurrencies();
        ViewBag.SelectedBase = @base.ToUpper();
        ViewBag.SelectedTarget = target.ToUpper();
        ViewBag.SelectedDays = days;

        var trend = await _rateService.GetTrendDataAsync(@base, target, days);
        return View(trend);
    }

    [HttpGet]
    public async Task<IActionResult> GetChartData(string @base, string target, int days = 30)
    {
        var trend = await _rateService.GetTrendDataAsync(@base, target, days);
        if (trend == null) return NotFound();

        var data = trend.History.Select(h => new
        {
            date = h.Date.ToString("yyyy-MM-dd"),
            rate = Math.Round(h.Rate, 6)
        });
        return Json(data);
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}

// ─── Favorites ───────────────────────────────────────────────────────────────

[Authorize]
public class FavoritesController : Controller
{
    private readonly INotificationService _notifService;
    private readonly IExchangeRateService _rateService;

    public FavoritesController(INotificationService notifService, IExchangeRateService rateService)
    {
        _notifService = notifService;
        _rateService = rateService;
    }

    public async Task<IActionResult> Index()
    {
        var userId = GetUserId();
        ViewBag.UnreadCount = await _notifService.GetUnreadCountAsync(userId);
        ViewBag.AllCurrencies = _rateService.GetAllCurrencies();
        var favorites = await _notifService.GetFavoritesAsync(userId);

        // Enrich with live rates
        var enriched = new List<(FavoriteCurrency Fav, double Rate, double Change)>();
        foreach (var fav in favorites)
        {
            if (!fav.IsCrypto)
            {
                var rate = await _rateService.GetRateAsync("USD", fav.CurrencyCode);
                enriched.Add((fav, rate, 0.12)); // mock change
            }
        }
        ViewBag.Enriched = enriched;
        return View(favorites);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Add(string code, string name, string flag, bool isCrypto = false)
    {
        await _notifService.AddFavoriteAsync(GetUserId(), code, name, flag, isCrypto);
        TempData["Success"] = $"{code} added to favorites!";
        return RedirectToAction("Index");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Remove(string code)
    {
        await _notifService.RemoveFavoriteAsync(GetUserId(), code);
        TempData["Success"] = $"{code} removed from favorites.";
        return RedirectToAction("Index");
    }

    [HttpPost]
    public async Task<IActionResult> Toggle(string code, string name, string flag, bool isCrypto = false)
    {
        var userId = GetUserId();
        var favorites = await _notifService.GetFavoritesAsync(userId);
        if (favorites.Any(f => f.CurrencyCode == code))
            await _notifService.RemoveFavoriteAsync(userId, code);
        else
            await _notifService.AddFavoriteAsync(userId, code, name, flag, isCrypto);
        return Ok();
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}

// ─── Notifications ────────────────────────────────────────────────────────────

[Authorize]
public class NotificationsController : Controller
{
    private readonly INotificationService _notifService;
    private readonly IExchangeRateService _rateService;

    public NotificationsController(INotificationService notifService, IExchangeRateService rateService)
    {
        _notifService = notifService;
        _rateService = rateService;
    }

    public async Task<IActionResult> Index()
    {
        var userId = GetUserId();
        var vm = new NotificationsViewModel
        {
            Alerts = await _notifService.GetAlertsAsync(userId),
            Logs = await _notifService.GetLogsAsync(userId),
            AllCurrencies = _rateService.GetAllCurrencies(),
            UnreadCount = await _notifService.GetUnreadCountAsync(userId)
        };
        await _notifService.MarkLogsReadAsync(userId);
        return View(vm);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateAlert(CreateAlertViewModel model)
    {
        if (!ModelState.IsValid)
        {
            TempData["Error"] = "Please fill in all fields correctly.";
            return RedirectToAction("Index");
        }
        await _notifService.CreateAlertAsync(GetUserId(), model);
        TempData["Success"] = $"Alert created for {model.BaseCurrency}/{model.TargetCurrency}!";
        return RedirectToAction("Index");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteAlert(int id)
    {
        await _notifService.DeleteAlertAsync(GetUserId(), id);
        TempData["Success"] = "Alert deleted.";
        return RedirectToAction("Index");
    }

    [HttpGet]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _notifService.GetUnreadCountAsync(GetUserId());
        return Json(new { count });
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}
