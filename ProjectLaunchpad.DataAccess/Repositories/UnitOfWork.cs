using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.DataAccess.Repositories;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Repositories.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _db;
        public IUserRepository Users { get; }
        public ITaskRepository TaskRepository { get; }

        public ISubTaskRepository SubTaskRepository { get; }

        public IMilestoneRepository MilestoneRepository { get; }

        // 

        public UnitOfWork(ApplicationDbContext db)
        {
            _db = db;
            Users = new UserRepository(_db);
            TaskRepository = new TaskRepository(_db);
            SubTaskRepository = new SubTaskRepository(_db);
            MilestoneRepository = new MilestoneRepository(_db);
            ///
        }

        public async Task<int> SaveAsync()
        {
            return await _db.SaveChangesAsync();
        }

        public void Dispose()
        {
            _db.Dispose();
        }
    }
}
