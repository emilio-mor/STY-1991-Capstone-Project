using OverdriveExchange.Models;
using Microsoft.EntityFrameworkCore;

namespace OverdriveExchange.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User>             Users              { get; set; }
    public DbSet<FavoriteCurrency> FavoriteCurrencies { get; set; }
    public DbSet<RateAlert>        RateAlerts         { get; set; }
    public DbSet<NotificationLog>  NotificationLogs   { get; set; }

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
        });

        b.Entity<FavoriteCurrency>(e =>
        {
            e.HasKey(f => f.Id);
            e.HasOne(f => f.User).WithMany(u => u.Favorites).HasForeignKey(f => f.UserId);
            e.HasIndex(f => new { f.UserId, f.CurrencyCode }).IsUnique();
        });

        b.Entity<RateAlert>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasOne(a => a.User).WithMany(u => u.Alerts).HasForeignKey(a => a.UserId);
        });

        b.Entity<NotificationLog>(e =>
        {
            e.HasKey(n => n.Id);
        });
    }
}

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (!db.Users.Any())
        {
            var demo = new User
            {
                Username     = "demo",
                Email        = "demo@overdriveexchange.app",
                FullName     = "Demo User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("demo123"),
                CreatedAt    = DateTime.UtcNow
            };
            db.Users.Add(demo);
            db.SaveChanges();

            db.FavoriteCurrencies.AddRange(
                new FavoriteCurrency { UserId=demo.Id, CurrencyCode="EUR", CurrencyName="Euro",            Flag="🇪🇺" },
                new FavoriteCurrency { UserId=demo.Id, CurrencyCode="GBP", CurrencyName="British Pound",   Flag="🇬🇧" },
                new FavoriteCurrency { UserId=demo.Id, CurrencyCode="JPY", CurrencyName="Japanese Yen",    Flag="🇯🇵" },
                new FavoriteCurrency { UserId=demo.Id, CurrencyCode="BRL", CurrencyName="Brazilian Real",  Flag="🇧🇷" },
                new FavoriteCurrency { UserId=demo.Id, CurrencyCode="HNL", CurrencyName="Honduran Lempira",Flag="🇭🇳" }
            );

            db.RateAlerts.AddRange(
                new RateAlert { UserId=demo.Id, BaseCurrency="USD", TargetCurrency="EUR", TargetRate=0.95, Condition=AlertCondition.Above },
                new RateAlert { UserId=demo.Id, BaseCurrency="USD", TargetCurrency="JPY", TargetRate=145,  Condition=AlertCondition.Below }
            );
            db.SaveChanges();
        }
    }
}
