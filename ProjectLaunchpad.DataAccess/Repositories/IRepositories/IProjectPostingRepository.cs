using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IProjectPostingRepository
    {
        Task<IEnumerable<ProjectPosting>> GetAllProjectPostingsAsync();
        Task<ProjectPosting?> GetProjectPostingByIdAsync(int id);
        Task<IEnumerable<ProjectPosting>> GetProjectPostingsByCategoryAsync(string categoryOrDomain);
        Task<IEnumerable<ProjectPosting>> GetProjectPostingsByDeadlineRangeAsync(DateTime start, DateTime end);
        Task AddProjectPostingAsync(ProjectPosting projectPosting);
        Task UpdateProjectPostingAsync(ProjectPosting projectPosting);
        Task DeleteProjectPostingAsync(int id);
    }
}
