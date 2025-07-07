using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IlogRepository
    {
        // Get all logs 
        Task<IEnumerable<Logs>> GetAllAsync();

        // Get a log by taskID
        Task<Logs?> GetByTaskIdAsync(int id);

        // Add a new log entry (e.g., when timer starts or resumes)
        Task AddAsync(Logs log);

        // Update an existing log (e.g., when timer is paused or stopped)
        Task UpdateStatusAsync(int logId, LogStatus newStatus);



    }
}
