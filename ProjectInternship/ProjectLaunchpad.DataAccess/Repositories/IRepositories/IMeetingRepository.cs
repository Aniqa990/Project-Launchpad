using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IMeetingRepository
    {
        Task AddAsync(Meeting entity);

        Task UpdateAsync(Meeting entity);


        Task<Meeting?> GetMeetingWithParticipantsAsync(int meetingId);
        Task<IEnumerable<Meeting>> GetMeetingsByProjectIdAsync(int projectId);
    }
}
