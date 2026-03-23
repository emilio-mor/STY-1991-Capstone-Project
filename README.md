# STY-1991-Capstone-Project
Software Engineering Concepts Project
Overdrive Exchange — Blazor Server + C# Backend
A full-stack real-time exchange rate application built entirely with C# / ASP.NET Core 8 and Blazor Server.

Tech Stack
Layer	Technology
Backend	| C# ASP.NET Core 8
Frontend |	Blazor Server (C# components)
Database |	SQLite via EF Core 8
Auth |	BCrypt password hashing, session-based
Charts |	Pure SVG — zero JavaScript
Styling	| Custom CSS (dark terminal theme)
----------
Quick Start
Prerequisites
[.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
----------
Run
git clone / copy project to folder
cd OverdriveExchange

dotnet restore
dotnet run
Open http://localhost:5000
--------------
Demo Credentials
Field |	Value
Email |	demo@overdriveexchange.app
Username |	demo
Password |	demo123
----------
Project Structure
OverdriveExchange/
├── OverdriveExchange.csproj                    ← Project file (NuGet packages)
├── Program.cs                        ← App startup, DI, routing
├── appsettings.json
│
├── Models/
│   └── Models.cs                     ← All domain models + ViewModels
│
├── Data/
│   └── AppDbContext.cs               ← EF Core DbContext + DbSeeder
│
├── Services/
│   └── Services.cs                   ← All services:
│                                       • AuthService (login, register)
│                                       • ExchangeRateService (53 currencies)
│                                       • FavoritesService
│                                       • AlertService
│                                       • AlertMonitorService (background)
│
├── Components/
│   ├── App.razor                     ← Root component + Router
│   ├── _Imports.razor                ← Global usings
│   │
│   ├── Layout/
│   │   └── MainLayout.razor          ← Sidebar, nav, auth guard
│   │
│   ├── Pages/
│   │   ├── Login.razor               ← Login + Register (tabs)
│   │   ├── Dashboard.razor           ← Forex + Crypto + Favorites
│   │   ├── Converter.razor           ← Currency converter
│   │   ├── Trends.razor              ← SVG chart + history table
│   │   ├── Favorites.razor           ← Manage favorites
│   │   └── Alerts.razor              ← Rate alerts + notification log
│   │
│   └── Shared/
│       ├── Sparkline.razor           ← Inline SVG sparkline (no JS)
│       └── SvgLineChart.razor        ← Full SVG area chart (no JS)
│
├── Pages/
│   └── _Host.cshtml                  ← Blazor Server HTML host page
│
└── wwwroot/
    ├── css/app.css                   ← Full dark theme design system
    └── js/app.js                     ← Minimal JS helpers
Features
🔐 Authentication
Login with email or username
BCrypt hashed passwords
Scoped AuthService keeps session in Blazor circuit
Register new accounts with full validation
📊 Dashboard
Good morning/afternoon/evening greeting
4 stat cards (currencies, crypto, favorites, alerts)
Top 5 Forex pairs (EUR, GBP, JPY, CAD, AUD vs USD) with inline SVG sparklines
Top 5 Crypto (BTC, ETH, BNB, SOL, XRP) with market caps
★ Star any pair to add to favorites directly from dashboard
Favorites quick-access strip
💱 Converter
53 world currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, BRL, HNL, and 44 more)
Real-time rate calculation as you change inputs
⇄ Swap button
Inverse rate display
Quick reference table (1, 5, 10, 25, 50, 100, 500, 1000 units)
Popular pair shortcuts
📈 Trends
Any pair from 53 supported currencies
Period selector: 7 / 14 / 30 / 60 / 90 days
Pure SVG area chart — no Chart.js, no JavaScript
Stats: current rate, period change %, high, low
Full historical data table
★ Favorites
Search by code or name across all 53 currencies
One-click add/remove
Live USD rates displayed per favorite
Quick Convert and Trend links
Persisted to SQLite per user
🔔 Rate Alerts
Set alerts: rate goes Above or Below a target
Background AlertMonitorService checks every 60 seconds
Notification log with unread indicators
Mark all read
Architecture Notes
Why Blazor Server?
All C# — components, services, models, routing — everything in one language
No JavaScript frameworks — React/Vue/Angular replaced by Razor components
Real-time by default — Blazor's SignalR connection enables live UI updates
SVG charts in C# — SvgLineChart.razor and Sparkline.razor render charts server-side using C# math, zero JS
Auth Architecture
AuthService is scoped to the Blazor circuit (one per browser connection). On login, UserId, Username, and FullName are stored in the service. MainLayout reads Auth.IsAuth to gate all pages. No cookie middleware needed — Blazor's persistent SignalR connection maintains the session.

Extending to Live APIs
Replace the mock data in ExchangeRateService.GetTopForex() and GetRate() with real API calls:

// ExchangeRate-API (free tier)
var json = await _http.GetStringAsync(
    "https://v6.exchangerate-api.com/v6/YOUR_KEY/latest/USD");

// CoinGecko (no key needed)
var json = await _http.GetStringAsync(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=5");
Add HttpClient to DI in Program.cs:

builder.Services.AddHttpClient<IExchangeRateService, ExchangeRateService>();
NuGet Packages
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools"  Version="8.0.0" />
<PackageReference Include="BCrypt.Net-Next"                      Version="4.0.3" />
Overdrive Exchange — 100% C# · Blazor Server · EF Core · SQLite · BCrypt · Pure SVG Charts


## 📋 Supported Currencies

The app supports 59 currencies including:
USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, BRL, MXN, INR, KRW, SGD, HKD, SEK, NOK, DKK, NZD, ZAR, ARS, CLP, COP, PEN, **HNL (Honduran Lempira)**, GTQ, CRC, DOP, TRY, RUB, THB, IDR, MYR, PHP, VND, EGP, NGN, KES, GHS, AED, SAR, ILS, QAR, PKR, BDT, UAH, RON, HUF, CZK, PLN, TWD, HRK, BGN, ISK, MAD, JOD, OMR, KWD, BHD, LKR, MMK

---
