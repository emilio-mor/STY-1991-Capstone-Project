main
using Microsoft.EntityFrameworkCore;

namespace OverdriveExchange.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; } = default!;
        public DbSet<Favorite> Favorites { get; set; } = default!;
        public DbSet<Alert> Alerts { get; set; } = default!;

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Optional: Seed database with initial data
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Example seeding (optional):
            // modelBuilder.Entity<User>().HasData(
            //     new User { Id = 1, Username = "demo", Email = "demo@overdriveexchange.app", FullName = "Demo User", PasswordHash = "..." }
            // );
        }
    }

@inherits LayoutComponentBase
@inject AuthService Auth
@inject NavigationManager Nav

@if (!Auth.IsAuth)
{
    <OverdriveExchange.Components.Pages.Login />
}
else
{
    <div class="shell">
        <!-- Sidebar -->
        <nav class="sidebar">
            <div class="sidebar-brand">
                <span class="brand-badge">OX</span>
                <span class="brand-text">Overdrive <span class="brand-accent">Exchange</span></span>
            </div>

            <ul class="nav-links">
                <li><NavLink href="/" Match="NavLinkMatch.All" class="nav-item">
                    <span class="nav-icon">⬡</span><span class="nav-label">Dashboard</span>
                </NavLink></li>
                <li><NavLink href="/converter" class="nav-item">
                    <span class="nav-icon">⇄</span><span class="nav-label">Converter</span>
                </NavLink></li>
                <li><NavLink href="/trends" class="nav-item">
                    <span class="nav-icon">↗</span><span class="nav-label">Trends</span>
                </NavLink></li>
                <li><NavLink href="/favorites" class="nav-item">
                    <span class="nav-icon">★</span><span class="nav-label">Favorites</span>
                </NavLink></li>
                <li><NavLink href="/alerts" class="nav-item">
                    <span class="nav-icon">🔔</span><span class="nav-label">Alerts</span>
                    @if (_unread > 0)
                    {
                        <span class="nav-badge">@_unread</span>
                    }
                </NavLink></li>
            </ul>

            <div class="sidebar-user">
                <div class="user-avatar">@Auth.FullName?.Substring(0,1).ToUpper()</div>
                <div class="user-info">
                    <div class="user-name">@Auth.FullName</div>
                    <div class="user-handle">@@Auth.Username</div>
                </div>
                <button class="logout-btn" @onclick="Logout" title="Logout">⏻</button>
            </div>
        </nav>

        <!-- Main -->
        <main class="main">
            @Body
        </main>
    </div>
}

@code {
    private int _unread;
    private System.Timers.Timer? _timer;

    [Inject] private IAlertService AlertSvc { get; set; } = default!;

    protected override void OnInitialized()
    {
        Auth.OnChange += StateHasChanged;
        _timer = new System.Timers.Timer(30_000);
        _timer.Elapsed += async (_, _) => await RefreshUnread();
        _timer.Start();
    }

    protected override async Task OnAfterRenderAsync(bool first)
    {
        if (first && Auth.IsAuth) await RefreshUnread();
    }

    private async Task RefreshUnread()
    {
        if (Auth.UserId.HasValue)
        {
            _unread = await AlertSvc.GetUnreadCountAsync(Auth.UserId.Value);
            await InvokeAsync(StateHasChanged);
        }
    }

    private void Logout()
    {
        Auth.Logout();
        Nav.NavigateTo("/", forceLoad: true);
    }

    public void Dispose()
    {
        Auth.OnChange -= StateHasChanged;
        _timer?.Dispose();
    }
}
