using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IProjectRepository
    {
        Task<IEnumerable<Project>> GetAllProjectsAsync();
        Task<Project?> GetProjectByIdAsync(int id);
        Task<List<Project>> GetProjectsByFreelancerAsync(int freelancerId);

        Task<List<Project>> GetProjectsByClientAsync(int clientId);
        Task<IEnumerable<Project>> GetProjectsByCategoryAsync(string categoryOrDomain);
        Task<IEnumerable<Project>> GetProjectsByDeadlineRangeAsync(DateTime start, DateTime end);
        Task<List<Project>> GetProjectsWithPendingApprovalAsync();
        Task<int> GetProjectCountWithPendingApprovalStatus();
        Task AddProjectAsync(Project project);
        Task UpdateProjectAsync(Project project);
        Task DeleteProjectAsync(int id);
        Task<List<Project>> GetProjectsByClientIdAsync(int clientId);
        Task<int> GetCompletedProjectsCountAsync();
    }
}