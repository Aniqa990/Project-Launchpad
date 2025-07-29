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
    public class MeetingRepository:IMeetingRepository
    {
        private readonly ApplicationDbContext _db;
        public MeetingRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<Meeting?> GetMeetingWithParticipantsAsync(int meetingId)
        {
            return await _db.Meetings
                .Include(m => m.Participants)
                .FirstOrDefaultAsync(m => m.Id == meetingId);
        }

        public async Task<IEnumerable<Meeting>> GetMeetingsByProjectIdAsync(int projectId)
        {
            return await _db.Meetings
                .Include(m => m.Participants)
                    .ThenInclude(p => p.User) // 👈 This loads user data
                .Where(m => m.ProjectId == projectId)
                .ToListAsync();
        }


        public async Task AddAsync(Meeting entity)
        {
            await _db.Meetings.AddAsync(entity);
        }

        public async Task UpdateAsync(Meeting entity)
        {
            _db.Meetings.Update(entity);
            await Task.CompletedTask;
        }

    }
}
