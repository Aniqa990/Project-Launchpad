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
    }
}
