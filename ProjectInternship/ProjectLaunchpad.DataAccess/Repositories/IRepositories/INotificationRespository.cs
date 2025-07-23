using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ProjectLaunchpad.Models.Models;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface INotificationRepository
    {
        Task<IEnumerable<Notification>> GetNotificationByUserAsync(int Id);
    }
}
