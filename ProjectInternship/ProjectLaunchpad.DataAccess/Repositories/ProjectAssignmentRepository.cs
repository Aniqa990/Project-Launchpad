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

        public async Task<List<FreelancerWithUserDTO>> GetFreelancersByProjectAsync(int projectId)
        {
            return await _db.projectFreelancers
                .Where(pa => pa.ProjectId == projectId)
                .Select(pa => new FreelancerWithUserDTO
                {
                    Profile = pa.Freelancer,
                    User = pa.Freelancer.User
                })
                .ToListAsync();
        }

        public async Task<List<object>> GetProjectsByFreelancerAsync(int freelancerId)
        {
            return await _db.projectFreelancers
                .Where(pa => pa.FreelancerId == freelancerId)
                .Select(pa => new {
                    Id = pa.Project.Id,
                    Title = pa.Project.Title,
                    Description = pa.Project.Description,
                    Status = pa.Project.Status,
                    Budget = pa.Project.Budget,
                    Deadline = pa.Project.Deadline,
                    ClientId = pa.Project.ClientId,
                    Client = new
                    {
                        User = new
                        {
                            Id = pa.Project.Client.User.Id,
                            FirstName = pa.Project.Client.User.FirstName,
                            LastName = pa.Project.Client.User.LastName,
                            Email = pa.Project.Client.User.Email,
                            PhoneNo = pa.Project.Client.User.PhoneNo,
                            ProfilePicture = pa.Project.Client.User.ProfilePicture,
                            Role = pa.Project.Client.User.Role,
                            Gender = pa.Project.Client.User.Gender,
                            CreatedAt = pa.Project.Client.User.CreatedAt
                        }
                    },
                    SkillsRequired = pa.Project.SkillsRequired,
                    AssignedFreelancers = pa.Project.AssignedFreelancers.Select(af => new {
                        Freelancer = new
                        {
                            User = new
                            {
                                Id = af.Freelancer.User.Id,
                                FirstName = af.Freelancer.User.FirstName,
                                LastName = af.Freelancer.User.LastName,
                                Email = af.Freelancer.User.Email,
                                PhoneNo = af.Freelancer.User.PhoneNo,
                                ProfilePicture = af.Freelancer.User.ProfilePicture,
                                Role = af.Freelancer.User.Role,
                                Gender = af.Freelancer.User.Gender,
                                CreatedAt = af.Freelancer.User.CreatedAt
                            }
                        }
                    }).ToList(),
                    milestones = pa.Project.Milestones.Select(m => new { Name = m.Title }).ToList(),
                })
                .Cast<object>()
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
