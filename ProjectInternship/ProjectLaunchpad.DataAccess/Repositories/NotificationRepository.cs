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
    public class NotificationRepository: INotificationRepository
    {
        private readonly ApplicationDbContext _db;
        public NotificationRepository(ApplicationDbContext db) => _db = db;
        public async Task<IEnumerable<Notification>> GetNotificationByUserAsync(int Id)
        {
            return await _db.notifications
                .Include(n => n.User)
                .Where(u => u.UserId == Id)
                .ToListAsync();
        }
    }
}
