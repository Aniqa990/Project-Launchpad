using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.Models.Models;
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
        public DbSet<Subtask> subtasks { get; set; }

        public DbSet<ProjectAssignment> projectFreelancers { get; set; }
        public DbSet<ProjectRequest> projectRequests { get; set; }
        public DbSet<ClientProfile> clientProfiles { get; set; }
        public DbSet<Milestone> milestones { get; set; } 

        public DbSet<Logs> logs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        public DbSet<Deliverables> deliverables { get; set; }

            modelBuilder.Entity<FreelancerProfile>(entity =>
            {
                entity.Property(f => f.HourlyRate)
                      .HasPrecision(18, 2);
        public DbSet<Payment> payments { get; set; }

                entity.Property(f => f.AvgRating)
                      .HasPrecision(3, 1);
            });

            modelBuilder.Entity<Project>(entity =>
            {
                entity.Property(p => p.Budget)
                      .HasPrecision(18, 2);
            });

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Client)
                .WithMany(c => c.Projects)
                .HasForeignKey(p => p.ClientId);

            modelBuilder.Entity<ProjectAssignment>()
                .HasKey(r => new { r.ProjectId, r.FreelancerId });


            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pf => pf.Project)
                .WithMany(f => f.AssignedFreelancers)
                .HasForeignKey(pf => pf.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pf => pf.Freelancer)
                .WithMany(p => p.ProjectAssignments)
                .HasForeignKey(pf => pf.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);
            // Prevent multiple cascade paths for TaskItem → User
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedToUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict); // or NoAction


            modelBuilder.Entity<ProjectRequest>()
                .HasKey(r => new { r.ProjectId, r.FreelancerId });
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict); // or NoAction

            modelBuilder.Entity<ProjectRequest>()
                .HasOne(r => r.Project)
                .WithMany(p => p.ProjectRequests)
                .HasForeignKey(r => r.ProjectId)
            // Logs: delete logs when freelancer (user) is deleted
            modelBuilder.Entity<Logs>()
                .HasOne(l => l.Freelancer)
                .WithMany()
                .HasForeignKey(l => l.FreelancerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectRequest>()
                .HasOne(r => r.Freelancer)
                .WithMany(f => f.ProjectRequests)
                .HasForeignKey(r => r.FreelancerId)
            // Logs: restrict task deletion if logs exist
            modelBuilder.Entity<Logs>()
                .HasOne(l => l.Task)
                .WithMany()
                .HasForeignKey(l => l.TaskId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    }
}
