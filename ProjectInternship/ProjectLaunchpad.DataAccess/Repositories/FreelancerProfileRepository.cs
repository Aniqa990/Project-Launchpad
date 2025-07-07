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

        public async Task AddFreelancerProfileAsync(FreelancerProfile profile)
        {
            await _db.freelancerProfiles.AddAsync(profile);
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
