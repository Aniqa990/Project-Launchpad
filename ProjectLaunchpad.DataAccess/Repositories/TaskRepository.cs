using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
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

        public async Task<IEnumerable<TaskItem>> GetAllAsync()
        {
            return await _db.taskItems.Include(t => t.Subtasks).ToListAsync();
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
            _db.taskItems.Remove(task);
        }
    }
}
