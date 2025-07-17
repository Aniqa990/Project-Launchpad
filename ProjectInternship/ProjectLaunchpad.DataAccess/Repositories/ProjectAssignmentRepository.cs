using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerProfile;
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
                    Id = pa.Freelancer.Id,
                    FirstName = pa.Freelancer.User.FirstName,
                    LastName = pa.Freelancer.User.LastName,
                    Email = pa.Freelancer.User.Email,
                    PhoneNo = pa.Freelancer.User.PhoneNo,
                    Gender = pa.Freelancer.User.Gender,
                    ProfilePicture = pa.Freelancer.User.ProfilePicture,
                    Role = pa.Freelancer.User.Role,
                    CreatedAt = pa.Freelancer.User.CreatedAt,
                    Skills = pa.Freelancer.Skills,
                    Experience = pa.Freelancer.Experience,
                    HourlyRate = pa.Freelancer.HourlyRate,
                    AvgRating = pa.Freelancer.AvgRating,
                    Availability = pa.Freelancer.Availability,
                    WorkingHours = pa.Freelancer.WorkingHours,
                    Summary = pa.Freelancer.Summary,
                    Projects = pa.Freelancer.Projects
                })
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
