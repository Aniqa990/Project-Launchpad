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
    public class ProjectAssignmentRepository : IProjectAssignmentRepository
    {
        private readonly ApplicationDbContext _db;

        public ProjectAssignmentRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task AssignFreelancersAsync(int projectId, int freelancerId)
        {
            var exists = await _db.projectFreelancers
                .AnyAsync(pa => pa.ProjectId == projectId && pa.FreelancerId == freelancerId);

            if (!exists)
            {
                await _db.projectFreelancers.AddAsync(new ProjectAssignment
                {
                    ProjectId = projectId,
                    FreelancerId = freelancerId
                });
            }
        }

        public async Task<List<User>> GetFreelancersByProjectAsync(int projectId)
        {
            return await _db.projectFreelancers
                .Where(pa => pa.ProjectId == projectId)
                .Select(pa => pa.Freelancer)
                .ToListAsync();
        }

        public async Task<List<Project>> GetProjectsByFreelancerAsync(int freelancerId)
        {
            return await _db.projectFreelancers
                .Where(pa => pa.FreelancerId == freelancerId)
                .Select(pa => pa.Project)
                .ToListAsync();
        }

        public async Task RemoveFreelancerFromProjectAsync(int projectId, int freelancerId)
        {
            var assignment = await _db.projectFreelancers
                .FirstOrDefaultAsync(pa => pa.ProjectId == projectId && pa.FreelancerId == freelancerId);

            if (assignment != null)
                _db.projectFreelancers.Remove(assignment);
        }
    }
}
