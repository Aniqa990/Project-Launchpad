using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class ProjectRequestRepository: IProjectRequestRepository
    {
        private readonly ApplicationDbContext _db;

        public ProjectRequestRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task CreateRequestAsync(ProjectRequestDTO request)
        {
            var exists = await _db.projectRequests
                .AnyAsync(pa => pa.ProjectId == request.ProjectId && pa.FreelancerId == request.FreelancerId);

            if (!exists)
            {
                await _db.projectRequests.AddAsync(new ProjectRequest
                {
                    ProjectId = request.ProjectId,
                    FreelancerId = request.FreelancerId,
                    RequestedAt = DateTime.UtcNow,
                    Status = "Pending"
                });
            }
        }
        public async Task<List<ProjectRequestDTO>> GetRequestsByFreelancerAsync(int freelancerId)
        {
            return await _db.projectRequests
                .Where(pr => pr.FreelancerId == freelancerId)
                .Include(pr => pr.Project)
                    .ThenInclude(p => p.Client)
                        .ThenInclude(c => c.User)
                .Select(pr => new ProjectRequestDTO
                {
                    ProjectId = pr.ProjectId,
                    ProjectTitle = pr.Project.Title,
                    ProjectDescription = pr.Project.Description,
                    ProjectCategory = pr.Project.Category,
                    Deadline = pr.Project.Deadline,
                    Skills = pr.Project.SkillsRequired,
                    ClientId = pr.Project.ClientId,
                    ClientName = pr.Project.Client.User.FirstName + " " + pr.Project.Client.User.LastName,
                    ClientEmail = pr.Project.Client.User.Email,
                    ClientProfilePicture = pr.Project.Client.User.ProfilePicture,
                    Status = pr.Status,
                    RequestedAt = pr.RequestedAt
                })
                .ToListAsync();
        }

        public async Task<ProjectRequest?> GetRequestByFreelancerAndProjectAsync(int freelancerId, int projectId)
        {

            return await _db.projectRequests.FirstOrDefaultAsync(pr => pr.FreelancerId == freelancerId && pr.ProjectId == projectId);
        }

        public async Task RemoveRequestAsync(int projectId, int freelancerId)
        {
            var request = await _db.projectRequests
                .FirstOrDefaultAsync(pr => pr.ProjectId == projectId && pr.FreelancerId == freelancerId);
            if (request != null)
            {
                _db.projectRequests.Remove(request);
            }
        }

    }
}
