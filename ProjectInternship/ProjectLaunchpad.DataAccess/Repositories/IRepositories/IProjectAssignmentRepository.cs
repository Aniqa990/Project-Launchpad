using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IProjectAssignmentRepository
    {
        Task AssignFreelancersAsync(int projectId, int freelancerId);
        Task<List<User>> GetFreelancersByProjectAsync(int projectId);
        Task<List<Project>> GetProjectsByFreelancerAsync(int freelancerId);
        Task RemoveFreelancerFromProjectAsync(int projectId, int freelancerId);
    }

}
