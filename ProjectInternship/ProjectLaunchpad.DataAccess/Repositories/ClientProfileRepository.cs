using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class ClientProfileRepository : IClientProfileRepository
    {
        private readonly ApplicationDbContext _db;

        public ClientProfileRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task InsertClientProfile(int userId)
        {
            var clientProfile = new ProjectLaunchpad.Models.Models.ClientProfile
            {
                Id = userId
            };
            await _db.clientProfiles.AddAsync(clientProfile);
        }

        public async Task DeleteClientProfileAsync(int userId)
        {
            var clientProfile = await _db.clientProfiles.FindAsync(userId);
            if (clientProfile != null)
            {
                _db.clientProfiles.Remove(clientProfile);
            }
        }


    }
}
