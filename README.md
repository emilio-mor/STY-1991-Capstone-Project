# Overdrive Exchange — Blazor Server + Live API

Full-stack real-time exchange rate app built with **C# ASP.NET Core 8** and **Blazor Server**.  
Rates are fetched live from **exchangerate.host** (free tier) and cached for 10 minutes.

---

## Quick Start

### 1 — Get a free API key

Sign up at **https://exchangerate.host** (free plan, no credit card).  
Copy your Access Key.

### 2 — Add the key to appsettings.json

```json
"ExchangeRates": {
  "ApiKey": "PASTE_YOUR_KEY_HERE",
  "BaseUrl": "https://api.exchangerate.host"
}
```

### 3 — Run

```bash
cd OverdriveExchange
dotnet restore
dotnet run
```

Open **http://localhost:5000** — login with `demo` / `demo123`.

---

## Architecture

```
OverdriveExchange/
├── Program.cs                    ← DI, auth, routing (clean, ~50 lines)
├── appsettings.json              ← DB + API key config
│
├── Models/Models.cs              ← All domain models (one file)
├── Data/AppDbContext.cs          ← EF Core SQLite + seeder
│
├── Services/
│   ├── Services.cs               ← All services in one file:
│   │                               AuthService, RateCache,
│   │                               ExchangeRateService (LIVE API),
│   │                               FavoritesService, AlertService,
│   │                               AlertMonitorService (background)
│   └── AuthEndpoints.cs          ← HTTP login/logout handlers
│
├── Components/
│   ├── App.razor                 ← Router
│   ├── _Imports.razor            ← Global usings
│   ├── Layout/MainLayout.razor   ← Sidebar + auth guard
│   ├── Pages/
│   │   ├── Login.razor           ← Login + Register
│   │   ├── Dashboard.razor       ← Live forex overview
│   │   ├── Converter.razor       ← Live currency converter
│   │   ├── Trends.razor          ← Rate chart + history
│   │   ├── Favorites.razor       ← Saved currencies
│   │   └── Alerts.razor          ← Rate alert management
│   └── Shared/
│       ├── Sparkline.razor       ← SVG sparkline (no JS)
│       └── SvgLineChart.razor    ← SVG area chart (no JS)
│
└── wwwroot/
    ├── css/app.css               ← Full dark theme
    └── js/app.js                 ← Minimal JS helpers
```

---

## Live Rate API

**Provider:** exchangerate.host  
**Endpoint:** `GET /live?access_key=KEY&source=USD`  
**Returns:** All rates vs USD in one call  
**Cache:** 10-minute in-memory singleton (`RateCache`)  
**Fallback:** Hardcoded rates used when API is unreachable

The `RateCache` is a singleton so all users share one rate fetch.  
Cross-rates (e.g. EUR → BRL) are computed as: `rate(USD→BRL) / rate(USD→EUR)`.

---

## Simplifications Made

| Before | After |
|--------|-------|
| 440-line Services.cs with 6 separate classes | Still one file, but leaner — removed all hardcoded rate dictionaries |
| `Dictionary<string,double> _usd` with 54 fixed values | Replaced by live API + thin fallback |
| Sync `GetRate()` throughout | Async `GetRateAsync()` everywhere |
| Fake spark data from seeded random | Spark built around live rate |
| Crypto with hardcoded prices | Honest placeholder with upgrade path |
| `IsFavoriteAsync()` extra DB round-trip | Removed — callers use local HashSet |
| `RegisterModel` verbose validation attributes | Condensed to one-liners |
| `CurrencyInfo` class with 4 properties | Replaced with `record` (one line) |

---

## NuGet Packages

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools"  Version="8.0.0" />
<PackageReference Include="BCrypt.Net-Next"                      Version="4.0.3" />
```

Cookie auth and HttpClient are built into ASP.NET Core 8 — no extra packages.

---

## Demo Credentials

| Field    | Value                       |
|----------|-----------------------------|
| Username | `demo`                      |
| Password | `demo123`                   |
| Email    | `demo@overdriveexchange.app`|
