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
    public class MeetingParticipantRepository:IMeetingParticipantRepository
    {
        private readonly ApplicationDbContext _db;
        public MeetingParticipantRepository(ApplicationDbContext db) 
        {
            _db = db;
        }

        public async Task<IEnumerable<MeetingParticipant>> GetParticipantsByMeetingIdAsync(int meetingId)
        {
            return await _db.MeetingParticipants
                .Where(p => p.MeetingId == meetingId)
                .ToListAsync();
        }

        public async Task AddAsync(MeetingParticipant entity)
        {
            await _db.MeetingParticipants.AddAsync(entity);
        }

        public async Task AddRangeAsync(IEnumerable<MeetingParticipant> participants)
        {
            await _db.MeetingParticipants.AddRangeAsync(participants);
        }


    }
}
