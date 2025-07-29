using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.TaskDTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface ITaskRepository
    {
        Task<IEnumerable<TaskDto>> GetAllAsync();
        Task<TaskItem?> GetByIdAsync(int id);
        Task AddAsync(TaskItem task);
        void Update(TaskItem task);
        Task<IEnumerable<TaskDto>> GetTasksByProjectIdAsync(int projectId);

        void Delete(TaskItem task);

        Task<TaskItem?> FindTaskByTitleAndProjectAsync(string title, int projectId);

    }
}
