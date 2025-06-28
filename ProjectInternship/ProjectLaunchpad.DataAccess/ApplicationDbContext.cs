using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ProjectLaunchpad.Models;

namespace ProjectLaunchpad.DataAccess
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options):base(options)
        {
         
        }

        public DbSet<User> Users { get; set; }

        public DbSet<FreelancerProfile> FreelancerProfiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<FreelancerProfile>(entity =>
            {
                entity.Property(f => f.HourlyRate)
                      .HasPrecision(18, 2);

                entity.Property(f => f.FixedRate)
                      .HasPrecision(18, 2);

                entity.Property(f => f.AvgRating)
                      .HasPrecision(3, 1);
            });
        }
    }
}
