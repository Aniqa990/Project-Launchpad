using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerProfile;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class FreelancerProfileRepository : IFreelancerProfileRepository
    {
        private readonly ApplicationDbContext _db;

        public FreelancerProfileRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<FreelancerProfile?> GetProfileByUserIdAsync(int userId)
        {
            return await _db.freelancerProfiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == userId);
        }

        public async Task AddOrUpdateFreelancerProfileAsync(FreelancerWithUserDTO dto)
        {
            var existingProfile = await _db.freelancerProfiles.FindAsync(dto.Id);
            var existingUser = await _db.users.FindAsync(dto.Id);

            if (existingProfile != null && existingUser!=null )
            {
                // Update existing profile
                existingProfile.Skills = dto.Skills ?? existingProfile.Skills;
                existingProfile.Experience = dto.Experience ?? existingProfile.Experience;
                existingProfile.Projects = dto.Projects ?? existingProfile.Projects;
                existingProfile.HourlyRate = dto.HourlyRate ?? existingProfile.HourlyRate;
                existingProfile.AvgRating = dto.AvgRating ?? existingProfile.AvgRating;
                existingProfile.Availability = dto.Availability ?? existingProfile.Availability;
                existingProfile.WorkingHours = dto.WorkingHours ?? existingProfile.WorkingHours;
                existingProfile.Summary = dto.Summary ?? existingProfile.Summary;

                _db.freelancerProfiles.Update(existingProfile);

                existingUser.FirstName = dto.FirstName ?? existingUser.FirstName;
                existingUser.LastName = dto.LastName ?? existingUser.LastName;
                existingUser.PhoneNo = dto.PhoneNo ?? existingUser.PhoneNo;
                existingUser.ProfilePicture = dto.ProfilePicture ?? existingUser.ProfilePicture;

                _db.users.Update(existingUser);
            }
            else
            {
                // Create new profile
                var entity = new FreelancerProfile
                {
                    Id = dto.Id,
                    Skills = dto.Skills,
                    Experience = dto.Experience,
                    Projects = dto.Projects,
                    HourlyRate = dto.HourlyRate ?? 0,
                    AvgRating = dto.AvgRating ?? 0,
                    Availability = dto.Availability ?? "available",
                    WorkingHours = dto.WorkingHours ?? "9am-5pm",
                    Summary = dto.Summary ?? ""
                };

                await _db.freelancerProfiles.AddAsync(entity);
            }
        }

        public async Task AddFreelancerProfileAsync(FreelancerProfileDTO dto)
        {
            var entity = new FreelancerProfile
            {
                Id = dto.Id,
                Skills = dto.Skills,
                HourlyRate = dto.HourlyRate ?? 0,
                AvgRating = dto.AvgRating ?? 0,
                Availability = dto.Availability,
                WorkingHours = dto.WorkingHours,
                Summary = dto.Summary,
                Experience = dto.Experience,
                Projects = dto.Projects

            };

            await _db.freelancerProfiles.AddAsync(entity);
        }

        public Task UpdateFreelancerProfileAsync(FreelancerProfile profile)
        {
            _db.freelancerProfiles.Update(profile);
            return Task.CompletedTask;
        }
        
        public async Task DeleteFreelancerProfileAsync(int userId)
        {
            var profile = await GetProfileByUserIdAsync(userId);
            if (profile != null)
            {
                _db.freelancerProfiles.Remove(profile);
            }
        }

        public async Task<List<FreelancerProfile>> GetAllFreelancerProfilesAsync()
        {
            return await _db.freelancerProfiles
                .Include(p => p.User)
                .ToListAsync();
        }
    }
}
