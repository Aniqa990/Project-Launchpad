using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

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
        public DbSet<TaskItem> taskItems { get; set; }
        public DbSet<TimeSheet> TimeSheets { get; set; }
        public DbSet<ProjectAssignment> projectFreelancers { get; set; }
        public DbSet<ProjectRequest> projectRequests { get; set; }
        public DbSet<ClientProfile> clientProfiles { get; set; }
        public DbSet<Milestone> milestones { get; set; }
        public DbSet<Deliverables> deliverables { get; set; }
        public DbSet<Payment> payments { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
        public DbSet<Logs> logs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<FreelancerProfile>(entity =>
            {
                entity.Property(f => f.HourlyRate)
                      .HasPrecision(18, 2);

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

            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pf => pf.Freelancer)
                .WithMany(p => p.ProjectAssignments)
                .HasForeignKey(pf => pf.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Deliverables>()
                .HasOne(p => p.project)
                .WithMany(c => c.Deliverables)
                .HasForeignKey(p => p.projectId)
                .OnDelete(DeleteBehavior.Cascade);

            // Prevent multiple cascade paths for TaskItem → User
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedToUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict); // or NoAction

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict); // or NoAction


            modelBuilder.Entity<ProjectRequest>()
                .HasKey(r => new { r.ProjectId, r.FreelancerId });

            modelBuilder.Entity<ProjectRequest>()
                .HasOne(r => r.Project)
                .WithMany(p => p.ProjectRequests)
                .HasForeignKey(r => r.ProjectId)
                .OnDelete(  DeleteBehavior.Cascade);
            
            modelBuilder.Entity<ProjectRequest>()
                .HasOne(r => r.Freelancer)
                .WithMany(f => f.ProjectRequests)
                .HasForeignKey(r => r.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Logs: restrict task deletion if logs exist
            modelBuilder.Entity<Logs>()
                .HasOne(l => l.Task)
                .WithMany()
                .HasForeignKey(l => l.TaskId)
                .OnDelete(DeleteBehavior.Restrict);

            // Logs: delete logs when freelancer (user) is deleted
            modelBuilder.Entity<Logs>()
                .HasOne(l => l.Freelancer)
                .WithMany(f => f.Logs)
                .HasForeignKey(l => l.FreelancerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Milestone>()
                .HasOne(p => p.project)
                .WithMany(c => c.Milestones)
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Milestone>()
                .Property(m => m.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Feedback>()
            .HasKey(r => new { r.ProjectId, r.FreelancerId });

            modelBuilder.Entity<Feedback>()
                .Property(f => f.Rating)
                .HasPrecision(3, 1); //rating with 1 decimal place

            modelBuilder.Entity<Feedback>()
                .HasOne(r => r.Project)
                .WithMany(p => p.Feedbacks)
                .HasForeignKey(r => r.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Feedback>()
                .HasOne(r => r.Freelancer)
                .WithMany(f => f.Feedbacks)
                .HasForeignKey(r => r.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Freelancer)
                .WithMany()
                .HasForeignKey(p => p.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Project)
                .WithMany()
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<TimeSheet>()
                .Property(t => t.HourlyRate)
                .HasPrecision(18, 2);

            modelBuilder.Entity<TimeSheet>()
                .HasOne(ts => ts.Freelancer)
                .WithMany(f => f.TimeSheets)
                .HasForeignKey(ts => ts.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TimeSheet>()
                .HasOne(ts => ts.Project)
                .WithMany(p => p.TimeSheets)
                .HasForeignKey(ts => ts.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

        }

    }
}
