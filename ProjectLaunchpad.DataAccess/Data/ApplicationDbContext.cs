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
        public DbSet<ProjectPosting> ProjectPostings { get; set; }
        public DbSet<TimeSheet> TimeSheets { get; set; }
        public DbSet<Messaging> Messages{ get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
    }
}
