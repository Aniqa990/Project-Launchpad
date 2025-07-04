using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
            
        }

        public DbSet<User> users   { get; set; }

        public DbSet<TaskItem> taskItems { get; set; }

        public DbSet<Subtask> subtasks { get; set; }

        public DbSet<Milestone> milestones { get; set; } 

        public DbSet<Logs> logs { get; set; }

        public DbSet<Deliverables> deliverables { get; set; }

        public DbSet<Payment> payments { get; set; }

        public DbSet<Project> projects { get; set; }

        public DbSet<ProjectAssignment> projectFreelancers { get; set; }

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

            // Cascade: delete logs when user is deleted
            modelBuilder.Entity<Logs>()
                .HasOne(l => l.Freelancer)
                .WithMany()
                .HasForeignKey(l => l.FreelancerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Restrict: prevent task deletion if logs exist
            modelBuilder.Entity<Logs>()
                .HasOne(l => l.Task)
                .WithMany()
                .HasForeignKey(l => l.TaskId)
                .OnDelete(DeleteBehavior.Restrict);
        }

    }
}
