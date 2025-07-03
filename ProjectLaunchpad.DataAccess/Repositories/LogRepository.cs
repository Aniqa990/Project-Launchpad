using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.Enums;
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

        public async Task UpdateStatusAsync(int logId, LogStatus newStatus)
        {
            var log = await _db.logs.FindAsync(logId);
            if (log != null)
            {
                log.Status = newStatus;
                _db.logs.Update(log);
            }
        }




    }
}
