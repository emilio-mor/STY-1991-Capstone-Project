# STY-1991-Capstone-Project
Software Engineering Concepts Project
# FXPulse — Exchange Rate Web App

FXPulse is an application designed to provide real-time exchange rates for currencies worldwide, including both traditional fiat currencies and cryptocurrencies.

## Features

| Feature | Details |
|---|---|
| Authentication | Register & Login with BCrypt-hashed passwords, cookie auth, remember-me |
| Dashboard | Top 5 Forex pairs + Top 5 Cryptos vs USD with sparkline charts |
| Converter | Convert between 59 world currencies (e.g. BRL → HNL) |
| Trends | Interactive 7/14/30/60/90-day historical charts + data table |
| Favorites | Add/remove currencies, quick-access from dashboard |
| Alerts | Set rate threshold alerts (above/below), real-time push via SignalR |

FXPulse is designed to be a scalable, secure, and user-friendly platform that centralizes global and cryptocurrency exchange data in one powerful app.

## System Requirement Specification
### 1. Functional Requirements
The FXPulse system shall:
- Allow users to register a new account.
- Allow users to log in and log out securely.
- Encrypt and store user passwords using BCrypt hashing.
- Display the top 5 Forex pairs and top 5 cryptocurrencies on the dashboard.
- Allow users to convert between 59 supported currencies.
- Display historical exchange rate trends (7, 14, 30, 60, 90 days).
- Allow users to add and remove favorite currencies.
- Allow users to set rate threshold alerts (above or below a specified value).
- Monitor exchange rates in the background every 60 seconds.
- Send real-time notifications to users via SignalR when alerts are triggered.
- Store user preferences and alerts in a persistent SQLite database.

### 2. Non-Functional Requirements
The FXPulse system shall:
- Provide real-time exchange rate updates with minimal latency.
- Respond to user requests within 2 seconds under normal load.
- Support multiple concurrent users.
- Ensure secure authentication using hashed passwords and cookie-based authentication.
- Maintain data integrity using Entity Framework Core.
- Be compatible with modern web browsers (Chrome, Edge, Firefox).
- Be scalable to integrate live exchange rate APIs.
- Maintain 99% system availability under normal operating conditions.
- Use a clean and responsive dark-theme UI for better user experience.

## Tech Stack

- **ASP.NET Core 8 MVC** — C# backend, Razor views
- **Entity Framework Core + SQLite** — Persistent database (auto-migrated on startup)
- **BCrypt.Net-Next** — Secure password hashing
- **SignalR** — Real-time browser push notifications
- **Chart.js** — Interactive trend charts
- **Custom CSS** — Dark theme design system (no Bootstrap)

## Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)

### Run the app

```bash
# Clone / extract the project
cd ExchangeRateApp

# Restore NuGet packages
dotnet restore

# Run (database is auto-created on first run)
dotnet run
```

Then open: **http://localhost:5000**

### Demo Account
| Field | Value |
|---|---|
| Email/Username | `demo` |
| Password | `demo123` |

Or register a new account at `/Account/Register`

## Project Structure

```
ExchangeRateApp/
├── Controllers/
│   ├── AccountController.cs        # Login, Register, Logout
│   └── Controllers.cs              # Dashboard, Converter, Trends, Favorites, Notifications
├── Data/
│   └── AppDbContext.cs             # EF Core DbContext + seeder
├── Models/
│   ├── Models.cs                   # All domain models & ViewModels
│   └── Extensions.cs              # Helper extensions
├── Services/
│   ├── ExchangeRateService.cs      # Rate data (59 currencies, mock + API-ready)
│   └── Services.cs                 # UserService, NotificationService, SignalR Hub, Background monitor
├── Views/
│   ├── Account/Login.cshtml
│   ├── Account/Register.cshtml
│   ├── Dashboard/Index.cshtml
│   ├── Converter/Index.cshtml
│   ├── Trends/Index.cshtml
│   ├── Favorites/Index.cshtml
│   ├── Notifications/Index.cshtml
│   └── Shared/_Layout.cshtml
├── wwwroot/
│   ├── css/site.css                # Full dark theme design system
│   └── lib/signalr/signalr.min.js # SignalR client
├── Program.cs                      # App startup & DI
├── appsettings.json
└── ExchangeRateApp.csproj
```

## Connecting to Live Rate APIs

The app ships with realistic mock data. To use live rates:

### 1. ExchangeRate-API (Forex)
- Sign up at https://www.exchangerate-api.com/ (free tier available)
- In `appsettings.json`, set `UseMockData: false` and add your key
- Update `ExchangeRateService.GetTopForexRatesAsync()` to call `https://v6.exchangerate-api.com/v6/YOUR_KEY/latest/USD`

### 2. CoinGecko (Crypto)
- Free API at `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5`
- No API key required for basic use

## 🔧 Configuration

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=exchangerates.db"
  },
  "ExchangeRateApi": {
    "UseMockData": true,
    "ApiKey": "YOUR_KEY_HERE"
  }
}
```

## Real-time Notifications

Alerts are monitored by a background service (`RateMonitorService`) that checks every 60 seconds. When triggered:
1. Alert is marked as triggered in the database
2. A notification log entry is created
3. A real-time push is sent to the user's browser via SignalR

To use real SignalR, replace `/wwwroot/lib/signalr/signalr.min.js` with the official package:
```bash
dotnet add package Microsoft.AspNetCore.SignalR.Client
```
Or link directly:
```html
<script src="https://cdn.jsdelivr.net/npm/@microsoft/signalr@8.0.0/dist/browser/signalr.min.js"></script>
```

## 📋 Supported Currencies

The app supports 59 currencies including:
USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, BRL, MXN, INR, KRW, SGD, HKD, SEK, NOK, DKK, NZD, ZAR, ARS, CLP, COP, PEN, **HNL (Honduran Lempira)**, GTQ, CRC, DOP, TRY, RUB, THB, IDR, MYR, PHP, VND, EGP, NGN, KES, GHS, AED, SAR, ILS, QAR, PKR, BDT, UAH, RON, HUF, CZK, PLN, TWD, HRK, BGN, ISK, MAD, JOD, OMR, KWD, BHD, LKR, MMK

---
