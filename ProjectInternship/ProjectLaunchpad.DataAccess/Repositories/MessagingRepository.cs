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
    public  class MessagingRepository : IMessagingRepository
    {
        private readonly ApplicationDbContext _db;

        public MessagingRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Messaging>> GetMessagesBetweenUsersAsync(int senderId, int receiverId)
        {
            return await _db.Messages
                .Where(m =>
                    (m.SenderId == senderId && m.ReceiverId == receiverId) ||
                    (m.SenderId == receiverId && m.ReceiverId == senderId))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }

        public async Task<IEnumerable<Messaging>> GetMessagesForUserAsync(int userId)
        {
            return await _db.Messages
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.Timestamp)
                .ToListAsync();
        }

        public async Task<Messaging?> GetMessageByIdAsync(int id)
        {
            return await _db.Messages.FindAsync(id);
        }

        public async Task AddMessageAsync(Messaging message)
        {
            await _db.Messages.AddAsync(message);
        }

        public async Task UpdateMessageStatusAsync(int messageId, bool isRead)
        {
            var message = await _db.Messages.FindAsync(messageId);
            if (message != null)
            {
                message.IsRead = isRead;
            }
        }

        public async Task DeleteMessageAsync(int id)
        {
            var message = await _db.Messages.FindAsync(id);
            if (message != null)
            {
                _db.Messages.Remove(message);
            }
        }
    }
}
