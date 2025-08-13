using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IMeetingParticipantRepository
    {
        Task<IEnumerable<MeetingParticipant>> GetParticipantsByMeetingIdAsync(int meetingId);
        Task AddAsync(MeetingParticipant entity);

        Task AddRangeAsync(IEnumerable<MeetingParticipant> participants);

    }
}
