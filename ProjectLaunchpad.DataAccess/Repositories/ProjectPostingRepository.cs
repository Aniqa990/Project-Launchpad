using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class ProjectPostingRepository : IProjectPostingRepository
    {
        private readonly ApplicationDbContext _db;

        public ProjectPostingRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<ProjectPosting>> GetAllProjectPostingsAsync()
        {
            return await _db.ProjectPostings.ToListAsync();
        }

        public async Task<ProjectPosting?> GetProjectPostingByIdAsync(int id)
        {
            return await _db.ProjectPostings.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<ProjectPosting>> GetProjectPostingsByCategoryAsync(string categoryOrDomain)
        {
            return await _db.ProjectPostings
                            .Where(p => p.CategoryOrDomain.ToLower() == categoryOrDomain.ToLower())
                            .ToListAsync();
        }

        public async Task<IEnumerable<ProjectPosting>> GetProjectPostingsByDeadlineRangeAsync(DateTime start, DateTime end)
        {
            return await _db.ProjectPostings
                            .Where(p => p.Deadline >= start && p.Deadline <= end)
                            .ToListAsync();
        }

        public async Task AddProjectPostingAsync(ProjectPosting projectPosting)
        {
            await _db.ProjectPostings.AddAsync(projectPosting);
            await _db.SaveChangesAsync();
        }

        public async Task UpdateProjectPostingAsync(ProjectPosting projectPosting)
        {
            _db.ProjectPostings.Update(projectPosting);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteProjectPostingAsync(int id)
        {
            var project = await _db.ProjectPostings.FirstOrDefaultAsync(p => p.Id == id);
            if (project != null)
            {
                _db.ProjectPostings.Remove(project);
                await _db.SaveChangesAsync();
            }
        }
    }
}
