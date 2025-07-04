using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IMilestoneRepository
    {
        Task<IEnumerable<Milestone>> GetAllMilestonesAsync();
        Task<Milestone> GetMilestoneByIdAsync(int id);
        Task AddMilestoneAsync(Milestone milestone);
        Task UpdateMilestoneAsync(Milestone milestone);
        Task DeleteMilestoneAsync(int id);
        Task<IEnumerable<Milestone>> GetMilestonesByProjectIdAsync(int projectId);
        Task<IEnumerable<Milestone>> GetPendingMilestonesAsync();
        Task<IEnumerable<Milestone>> GetSubmittedMilestonesAsync();
        Task<IEnumerable<Milestone>> GetUnderReviewMilestonesAsync();
    }
}
