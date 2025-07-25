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
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> users { get; set; }
        public DbSet<FreelancerProfile> freelancerProfiles { get; set; }
        public DbSet<Subtask> subtasks { get; set; }
        public DbSet<TaskItem> taskItems { get; set; }
        public DbSet<TimeSheet> TimeSheets { get; set; }
        public DbSet<ProjectAssignment> projectFreelancers { get; set; }
        public DbSet<ProjectRequest> projectRequests { get; set; }
        public DbSet<ClientProfile> clientProfiles { get; set; }
        public DbSet<AdminProfile> adminProfiles { get; set; }
        public DbSet<Milestone> milestones { get; set; }
        public DbSet<Deliverables> deliverables { get; set; }
        public DbSet<Payment> payments { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
        public DbSet<Logs> logs { get; set; }
        public DbSet<Skill> skills { get; set; }
        public DbSet<ResumeProject> resumeProjects { get; set; }
        public DbSet<Experience> experiences { get; set; }
        public DbSet<Project> projects { get; set; }
        public DbSet<Notification> notifications { get; set; }

        public DbSet<Meeting> Meetings { get; set; }
        public DbSet<MeetingParticipant> MeetingParticipants { get; set; }

        public DbSet<MeetingAudioRecording> meetingAudioRecordings { get; set; }



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // FreelancerProfile
            modelBuilder.Entity<FreelancerProfile>(entity =>
            {
                entity.Property(f => f.HourlyRate).HasPrecision(18, 2);
                entity.Property(f => f.AvgRating).HasPrecision(3, 1);
            });

            // Project
            modelBuilder.Entity<Project>(entity =>
            {
                entity.Property(p => p.Budget).HasPrecision(18, 2);
                entity.HasOne(p => p.Client)
                      .WithMany(c => c.Projects)
                      .HasForeignKey(p => p.ClientId)
                      .OnDelete(DeleteBehavior.Restrict); // Changed from Cascade to Restrict
            });

            // ProjectAssignment
            modelBuilder.Entity<ProjectAssignment>()
                .HasKey(r => new { r.ProjectId, r.FreelancerId });

            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pf => pf.Project)
                .WithMany(f => f.AssignedFreelancers)
                .HasForeignKey(pf => pf.ProjectId)
                .OnDelete(DeleteBehavior.Restrict); // Avoids multiple paths

            modelBuilder.Entity<ProjectAssignment>()
                .HasOne(pf => pf.Freelancer)
                .WithMany(p => p.ProjectAssignments)
                .HasForeignKey(pf => pf.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Deliverables
            modelBuilder.Entity<Deliverables>()
                .HasOne(d => d.Milestone)
                .WithMany(m => m.Deliverables)
                .HasForeignKey(d => d.MilestoneId)
                .OnDelete(DeleteBehavior.Cascade); // Safe cascade

            // TaskItem
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedToUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ProjectRequest
            modelBuilder.Entity<ProjectRequest>()
                .HasKey(r => new { r.ProjectId, r.FreelancerId });

            modelBuilder.Entity<ProjectRequest>()
                .HasOne(r => r.Project)
                .WithMany(p => p.ProjectRequests)
                .HasForeignKey(r => r.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProjectRequest>()
                .HasOne(r => r.Freelancer)
                .WithMany(f => f.ProjectRequests)
                .HasForeignKey(r => r.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Logs
            modelBuilder.Entity<Logs>()
                .HasOne(l => l.Task)
                .WithMany()
                .HasForeignKey(l => l.TaskId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Logs>()
                .HasOne(l => l.Freelancer)
                .WithMany(f => f.Logs)
                .HasForeignKey(l => l.FreelancerId)
                .OnDelete(DeleteBehavior.Cascade); // Reasonable

            // Milestone
            modelBuilder.Entity<Milestone>()
                .HasOne(p => p.project)
                .WithMany(c => c.Milestones)
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Restrict); // Avoid multiple cascade paths

            modelBuilder.Entity<Milestone>()
                .Property(m => m.Amount)
                .HasPrecision(18, 2);

            // Feedback
            modelBuilder.Entity<Feedback>()
                .HasKey(r => new { r.ProjectId, r.FreelancerId });

            modelBuilder.Entity<Feedback>()
                .Property(f => f.Rating).HasPrecision(3, 1);

            modelBuilder.Entity<Feedback>()
                .HasOne(r => r.Project)
                .WithMany(p => p.Feedbacks)
                .HasForeignKey(r => r.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Feedback>()
                .HasOne(r => r.Freelancer)
                .WithMany(f => f.Feedbacks)
                .HasForeignKey(r => r.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Payments
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
                .OnDelete(DeleteBehavior.Restrict); // safer than NoAction

            // TimeSheets
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
                .OnDelete(DeleteBehavior.Restrict);
        }


    }
}
