using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.AuthenticationDTO;
using ProjectLaunchpad.Models.Models.DTOs.TaskDTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly ApplicationDbContext _db;

        public TaskRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<TaskDto>> GetAllAsync()
        {
            var taskEntities = await _db.taskItems
                .Include(t => t.Subtasks)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .ToListAsync();

            var taskDtos = taskEntities.Select(task => new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                EstimatedDeadline = task.EstimatedDeadline,
                Priority = task.Priority,
                Status = task.Status,
                CreatedAt = task.CreatedAt,

                CreatedByUser = new UserRegisterDTO
                {
                    FirstName = task.CreatedByUser.FirstName,
                    LastName = task.CreatedByUser.LastName,
                },
                AssignedToUser = new UserRegisterDTO
                {
                    FirstName = task.AssignedToUser.FirstName,
                    LastName = task.AssignedToUser.LastName,
                },

                Subtasks = task.Subtasks.Select(sub => new SubtaskDto
                {
                    Id = sub.Id,
                    Title = sub.Title,
                    Description = sub.Description,
                    DueDate = sub.DueDate,
                    Status = sub.Status
                }).ToList()
            });

            return taskDtos;
        }


        public async Task<TaskItem?> GetByIdAsync(int id)
        {
            return await _db.taskItems.Include(t => t.Subtasks).FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task AddAsync(TaskItem task)
        {
            await _db.taskItems.AddAsync(task);
        }

        public void Update(TaskItem task)
        {
            _db.taskItems.Update(task);
        }

        public void Delete(TaskItem task)
        {
            // Step 1: Delete logs manually for this task
            var logsToDelete = _db.logs.Where(l => l.TaskId == task.Id).ToList();
            _db.logs.RemoveRange(logsToDelete);

            // Step 2: Delete the task
            _db.taskItems.Remove(task);
        }
    }
}
