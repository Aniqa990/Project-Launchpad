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
    public class AdminProfileRepository : IAdminProfileRepository
    {
        private readonly ApplicationDbContext _db;

        public AdminProfileRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task InsertAdminProfile(int userId)
        {
            var adminProfile = new AdminProfile
            {
                Id = userId
            };
            await _db.adminProfiles.AddAsync(adminProfile);
        }

        public async Task DeleteAdminProfileAsync(int userId)
        {
            var adminProfile = await _db.adminProfiles.FindAsync(userId);
            if (adminProfile != null)
            {
                _db.adminProfiles.Remove(adminProfile);
            }
        }


    }
}
