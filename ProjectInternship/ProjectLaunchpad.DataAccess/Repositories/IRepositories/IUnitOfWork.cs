using ProjectLaunchpad.DataAccess.Repositories;
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
        IProjectPostingRepository Posting { get; }
        ITimeSheetRepository TimeSheet { get; }
        IMessagingRepository Messages { get; }
        IFeedbackRepository Feedbacks { get; }

        Task<int> SaveAsync();

    }
}
