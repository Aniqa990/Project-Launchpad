using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class ClientProfileRepository: IClientProfileRepository
    {
        private readonly ApplicationDbContext _db;

        public ClientProfileRepository(ApplicationDbContext db)
        {
            _db = db;
        }


    }
}
