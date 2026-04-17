using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using OverdriveExchange.Data;
using System.Security.Claims;

namespace OverdriveExchange.Services;

/// <summary>
/// Minimal API endpoints for login and logout.
/// Must run outside Blazor so ASP.NET can write the auth cookie
/// before the browser establishes its SignalR circuit.
/// </summary>
public static class AuthEndpoints
{
    public static async Task Login(HttpContext ctx,
        IDbContextFactory<AppDbContext> dbFactory)
    {
        var form         = await ctx.Request.ReadFormAsync();
        var emailOrUser  = form["emailOrUsername"].ToString().Trim();
        var password     = form["password"].ToString();
        var rememberMe   = form["rememberMe"].ToString() == "true";
        var returnUrl    = form["returnUrl"].ToString();

        await using var db = dbFactory.CreateDbContext();
        var user = await db.Users.FirstOrDefaultAsync(
            u => u.Email == emailOrUser || u.Username == emailOrUser);

        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            // Redirect back to login page with error flag
            ctx.Response.Redirect("/login?error=invalid");
            return;
        }

        user.LastLogin = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Build claims principal
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name,           user.Username),
            new(ClaimTypes.Email,          user.Email),
            new("FullName",                user.FullName),
        };

        var identity  = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var props     = new AuthenticationProperties
        {
            IsPersistent = rememberMe,
            ExpiresUtc   = rememberMe
                ? DateTimeOffset.UtcNow.AddDays(30)
                : DateTimeOffset.UtcNow.AddHours(8),
        };

        await ctx.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, props);

        var redirect = !string.IsNullOrEmpty(returnUrl) && returnUrl.StartsWith("/")
            ? returnUrl : "/";
        ctx.Response.Redirect(redirect);
    }

    public static async Task Logout(HttpContext ctx)
    {
        await ctx.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        ctx.Response.Redirect("/login");
    }
}
