using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models;

namespace ProjectLaunchpad.DataAccess.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options):base(options)
        {
         
        }

        public DbSet<User> users { get; set; }

        public DbSet<FreelancerProfile> freelancerProfiles { get; set; }

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
