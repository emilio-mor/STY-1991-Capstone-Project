using OverdriveExchange.Data;
using OverdriveExchange.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

// Database
builder.Services.AddDbContextFactory<AppDbContext>(opts =>
    opts.UseSqlite(builder.Configuration.GetConnectionString("Default")
        ?? "Data Source=overdriveexchange.db"));

// Cookie auth — persists login across Blazor circuit restarts
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.LoginPath        = "/login";
        o.ExpireTimeSpan   = TimeSpan.FromDays(7);
        o.SlidingExpiration = true;
        o.Cookie.HttpOnly  = true;
        o.Cookie.IsEssential = true;
    });
builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();

// App services
builder.Services.AddHttpClient<IExchangeRateService, ExchangeRateService>();
builder.Services.AddSingleton<RateCache>();           // in-memory forex rate cache
builder.Services.AddHttpClient<ICryptoService, CryptoService>();
builder.Services.AddSingleton<CryptoCache>();         // in-memory crypto cache
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IFavoritesService, FavoritesService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddHostedService<AlertMonitorService>();

var app = builder.Build();

// Seed DB
using (var scope = app.Services.CreateScope())
{
    var fac = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AppDbContext>>();
    using var db = fac.CreateDbContext();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

if (!app.Environment.IsDevelopment()) { app.UseExceptionHandler("/Error"); app.UseHsts(); }

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// HTTP endpoints for login/logout (must run outside Blazor to write cookies)
app.MapPost("/login-handler",  AuthEndpoints.Login);
app.MapGet ("/logout-handler", AuthEndpoints.Logout);

app.MapBlazorHub();
app.MapFallbackToPage("/_Host");

app.Run();
