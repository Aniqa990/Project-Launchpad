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
    public class ProjectRepository : IProjectRepository
    {
        private readonly ApplicationDbContext _db;

        public ProjectRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Project>> GetAllProjectsAsync()
        {
            return await _db.projects
                .Include(p => p.Client)
                .ThenInclude(c => c.User)
                .Include(p => p.AssignedFreelancers)
                .ThenInclude(af => af.Freelancer)
                .ThenInclude(f => f.User)
                .Include(p => p.Milestones)
                .ToListAsync();
        }

        public async Task<Project?> GetProjectByIdAsync(int id)
        {
            return await _db.projects
                .Include(p => p.Client)
                .ThenInclude(c => c.User)
                .Include(p => p.AssignedFreelancers)
                .ThenInclude(af => af.Freelancer)
                .ThenInclude(f => f.User)
                .Include(p => p.Milestones)
                .FirstOrDefaultAsync(p => p.Id == id);

        }

        public async Task<List<Project>> GetProjectsByFreelancerAsync(int freelancerId)
        {
            return await _db.projectFreelancers
                .Where(pa => pa.FreelancerId == freelancerId)
                .Include(pa => pa.Project)
                    .ThenInclude(p => p.Client)
                        .ThenInclude(c => c.User)
                .Include(pa => pa.Project)
                    .ThenInclude(p => p.AssignedFreelancers)
                        .ThenInclude(af => af.Freelancer)
                            .ThenInclude(f => f.User)
                .Include(pa => pa.Project)
                    .ThenInclude(p => p.Milestones)
                .Select(pa => pa.Project)
                .ToListAsync();
        }


        public async Task<IEnumerable<Project>> GetProjectsByCategoryAsync(string categoryOrDomain)
        {
            return await _db.projects
                            .Where(p => p.CategoryOrDomain.ToLower() == categoryOrDomain.ToLower())
                            .ToListAsync();
        }

        public async Task<IEnumerable<Project>> GetProjectsByDeadlineRangeAsync(DateTime start, DateTime end)
        {
            return await _db.projects
                            .Where(p => p.Deadline >= start && p.Deadline <= end)
                            .ToListAsync();
        }

        public async Task AddProjectAsync(Project project)
        {
            await _db.projects.AddAsync(project);
            await _db.SaveChangesAsync();
        }

        public async Task UpdateProjectAsync(Project project)
        {
            _db.projects.Update(project);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteProjectAsync(int id)
        {
            var project = await _db.projects.FirstOrDefaultAsync(p => p.Id == id);
            if (project != null)
            {
                _db.projects.Remove(project);
                await _db.SaveChangesAsync();
            }
        }
    }
}