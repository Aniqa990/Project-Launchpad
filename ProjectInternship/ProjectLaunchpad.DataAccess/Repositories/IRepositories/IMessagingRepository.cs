using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IMessagingRepository
    {
        Task<IEnumerable<Messaging>> GetMessagesBetweenUsersAsync(int senderId, int receiverId);
        Task<IEnumerable<Messaging>> GetMessagesForUserAsync(int userId);
        Task<Messaging?> GetMessageByIdAsync(int id);
        Task AddMessageAsync(Messaging message);
        Task UpdateMessageStatusAsync(int messageId, bool isRead);
        Task DeleteMessageAsync(int id);
    }
}
