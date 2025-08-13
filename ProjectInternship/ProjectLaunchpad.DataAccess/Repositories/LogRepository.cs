using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.Enums;
using ProjectLaunchpad.Repositories.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class LogRepository:IlogRepository
    {
        private readonly ApplicationDbContext _db;

        public LogRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Logs>> GetAllAsync()
        {
            return await _db.logs.ToListAsync();
        }

        //get logs by taskId
        public async Task<Logs?> GetByTaskIdAsync(int id)
        {
            return await _db.logs.FirstOrDefaultAsync(u=>u.TaskId == id);
        }

        public async Task AddAsync(Logs log)
        {
            await _db.logs.AddAsync(log);
        }

        public async Task<IEnumerable<Logs>> GetLogsByFreelancerIdAsync(int freelancerId)
        {
            return await _db.logs
       .Where(l => l.FreelancerId == freelancerId)
       .Include(l => l.Project)
       .Include(l => l.Task)
       .ToListAsync();
        }

        public async Task<IEnumerable<Logs>> GetTasksByProjectIdAsync(int projectId)
        {
            return await _db.logs
          .Include(l => l.Project)
          .Include(l => l.Task)
          .Where(l => l.ProjectId == projectId)
          .ToListAsync();
        }

        public async Task DeleteLogsByFreelancerId(int freelancerId)
        {
            var logs = await _db.logs.Where(l => l.FreelancerId == freelancerId).ToListAsync();
            if (logs != null && logs.Count > 0)
            {
                _db.logs.RemoveRange(logs);
                await _db.SaveChangesAsync();
            }
        }





    }
}
