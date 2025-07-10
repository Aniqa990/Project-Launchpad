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
        public IProjectPostingRepository Posting { get; }

        public ITimeSheetRepository TimeSheet { get; }
        public IMessagingRepository Messages { get; }

        public IFeedbackRepository Feedbacks { get; }

        // 

        public UnitOfWork(ApplicationDbContext db)
        {
            _db = db;
            Users = new UserRepository(_db);
            Posting = new ProjectPostingRepository(_db);
            TimeSheet = new TimeSheetRepository(_db);
            Messages = new MessagingRepository(_db);
            Feedbacks = new FeedbackRepository(_db);
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
