using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Repositories.Repositories.IRepositories
{
    public interface IUnitOfWork
    {
        IUserRepository Users { get; }

        ITaskRepository TaskRepository { get; }

        ISubTaskRepository SubTaskRepository { get; }

        IMilestoneRepository MilestoneRepository { get; }

        Task<int> SaveAsync();

    }
}
