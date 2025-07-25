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
        IProjectRepository ProjectRepository { get; }
        ISubTaskRepository SubTaskRepository { get; }
        IAdminProfileRepository AdminProfiles { get; }
        IMilestoneRepository MilestoneRepository { get; }

        IlogRepository logRepository { get; }

        IDeliverablesRepository DeliverablesRepository { get; }


        IPaymentRepository PaymentRepository { get; }

        ITimeSheetRepository TimeSheet { get; }
        IProjectRequestRepository ProjectRequests { get; }
        IFeedbackRepository Feedbacks { get; }

        IMeetingRepository Meeting { get; }
        IMeetingParticipantRepository MeetingParticipant { get; }

        IMeetingAudioRecordingRepository MeetingAudioRecording { get; }

        INotificationRepository NotificationRepository { get; }

        Task<int> SaveAsync();

    }
}
