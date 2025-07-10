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
        IFreelancerProfileRepository FreelancerProfiles { get; }
        IClientProfileRepository ClientProfiles { get; }
        IProjectAssignmentRepository ProjectFreelancers { get; }
        ITaskRepository TaskRepository { get; }

        ISubTaskRepository SubTaskRepository { get; }

        IMilestoneRepository MilestoneRepository { get; }

        IlogRepository logRepository { get; }

        IDeliverableRepository deliverableRepository { get; }

        IPaymentRepository PaymentRepository { get; }

        ITimeSheetRepository TimeSheet { get; }
        IProjectRequestRepository ProjectRequests { get; }
        IFeedbackRepository Feedbacks { get; }

        Task<int> SaveAsync();

    }
}
