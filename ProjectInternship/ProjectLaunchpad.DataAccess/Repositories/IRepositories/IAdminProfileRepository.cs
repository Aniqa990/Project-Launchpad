using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IAdminProfileRepository
    {
        Task InsertAdminProfile(int userId);
        Task DeleteAdminProfileAsync(int userId);

    }
}
