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
}
