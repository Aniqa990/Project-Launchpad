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
    public class SubTaskRepository:ISubTaskRepository
    {
        private readonly ApplicationDbContext _db;


        public SubTaskRepository(ApplicationDbContext db)
        {
            _db = db;
        }


        public async Task<IEnumerable<Subtask>> GetAllAsync(int ParenttaskId)
        {
            return await _db.subtasks.Where(s => s.TaskItemId == ParenttaskId).ToListAsync();
        }

        public async Task<IEnumerable<Subtask>> GetAllAsync()
        {
            var subtask = await _db.subtasks.Include(s => s.TaskItem).ToListAsync();
            return subtask;
        }
        public async Task<Subtask> GetByIdAsync(int id)
        {
            return await _db.subtasks.FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task AddAsync(Subtask task)
        {
            await _db.subtasks.AddAsync(task);
        }

        public void Update(Subtask task)
        {
            _db.subtasks.Update(task);
        }

        public void Delete(Subtask task)
        {
            _db.subtasks.Remove(task);
        }

        public async Task DeleteByIdAsync(int id)
        {
            var subtask = await _db.subtasks.FirstOrDefaultAsync(s => s.Id == id);
            if (subtask != null)
            {
                _db.subtasks.Remove(subtask);
            }
        }
    }
}
