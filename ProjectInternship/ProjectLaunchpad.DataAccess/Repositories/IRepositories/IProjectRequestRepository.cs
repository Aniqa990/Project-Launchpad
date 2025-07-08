using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IProjectRequestRepository
    {
        Task CreateRequestAsync(ProjectRequestDTO request);
        Task<List<ProjectRequestDTO>> GetRequestsByFreelancerAsync(int freelancerId);
        Task<ProjectRequest?> GetRequestByFreelancerAndProjectAsync(int freelancerId, int projectId);
        Task RemoveRequestAsync(int projectId, int freelancerId);
    }
}
