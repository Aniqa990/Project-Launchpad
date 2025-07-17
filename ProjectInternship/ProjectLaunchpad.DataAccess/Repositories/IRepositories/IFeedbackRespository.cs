using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IFeedbackRepository
    {
        Task AddFeedbackAsync(Feedback feedback);
        Task<Feedback?> GetFeedbackByIdAsync(int id);
        Task<IEnumerable<Feedback>> GetFeedbacksByFreelancerAsync(int freelancerId);
        Task<IEnumerable<Feedback>> GetFeedbacksByProjectAsync(int projectId);
        Task<IEnumerable<Feedback>> GetAllFeedbacksAsync();
        Task DeleteFeedbackAsync(int id);
    }
}