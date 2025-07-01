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

        public DbSet<Project> projects { get; set; }

        public DbSet<ProjectAssignment> projectFreelancers { get; set; }

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

            modelBuilder.Entity<Project>(entity =>
            {
                entity.Property(p => p.Budget)
                      .HasPrecision(18, 2);
            });

            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pf => pf.Project)
                .WithMany(f => f.AssignedFreelancers)
                .HasForeignKey(pf => pf.ProjectId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pf => pf.Freelancer)
                .WithMany()
                .HasForeignKey(pf => pf.FreelancerId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
