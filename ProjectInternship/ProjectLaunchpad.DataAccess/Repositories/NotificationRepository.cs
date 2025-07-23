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
    public class NotificationRepository : INotificationRepository
    {
        private readonly ApplicationDbContext _db;

        public NotificationRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task AddAsync(Notification notification)
        {
            await _db.notifications.AddAsync(notification);
            await _db.SaveChangesAsync();
        }

        public async Task<IEnumerable<Notification>> GetByUserId(int id)
        {
            return await _db.notifications
                .Where(n => n.UserId == id)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        // NEW
        public async Task<Notification> GetByIdAsync(int notificationId)
        {
            return await _db.notifications.FirstOrDefaultAsync(n => n.Id == notificationId);
        }

        // NEW
        public async Task UpdateAsync(Notification notification)
        {
            _db.notifications.Update(notification);
            await _db.SaveChangesAsync();
        }
    }
}
