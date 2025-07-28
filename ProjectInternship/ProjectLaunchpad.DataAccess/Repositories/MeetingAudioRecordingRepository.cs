using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class MeetingAudioRecordingRepository:IMeetingAudioRecordingRepository
    {
        private readonly ApplicationDbContext _db;


        public MeetingAudioRecordingRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task AddAsync(MeetingAudioRecording entity)
        {
            await _db.meetingAudioRecordings.AddAsync(entity);
        }

        public async Task<IEnumerable<MeetingAudioRecordingResponseDto>> getAll()

        {

            return await _db.meetingAudioRecordings

                .Include(r => r.user)

                .Select(r => new MeetingAudioRecordingResponseDto

                {

                    Id = r.Id,

                    MeetingId = r.MeetingId,

                    FilePath = r.AudioUrl!,

                    UploadedAt = r.UploadedAt,

                    UserId = r.UserId,

                    Username = r.user!.FirstName + " " + r.user.LastName

                })

                .ToListAsync();

        }

        public async Task DeleteAudioByUserId(int userId)
        {
            var recordings = await _db.meetingAudioRecordings
                .Where(r => r.UserId == userId)
                .ToListAsync();
            if (recordings.Any())
            {
                _db.meetingAudioRecordings.RemoveRange(recordings);
                await _db.SaveChangesAsync();
            }
        }

    }
}
