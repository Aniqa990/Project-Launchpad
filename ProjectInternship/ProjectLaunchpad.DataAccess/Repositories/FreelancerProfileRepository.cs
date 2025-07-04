using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models.DTOs;
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
            return await _db.freelancerProfiles.FirstOrDefaultAsync(p => p.Id == userId);
        }

        public async Task AddFreelancerProfileAsync(FreelancerProfileDTO dto)
        {
            var entity = new FreelancerProfile
            {
                Id = dto.UserId,
                Skills = dto.Skills,
                HourlyRate = dto.HourlyRate ?? 0,
                AvgRating = dto.AvgRating ?? 0,
                Availability = dto.Availability,
                WorkingHours = dto.WorkingHours,
                Summary = dto.Summary,
                Experience = dto.Experience

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
            return await _db.freelancerProfiles.ToListAsync();
        }
    }
}
