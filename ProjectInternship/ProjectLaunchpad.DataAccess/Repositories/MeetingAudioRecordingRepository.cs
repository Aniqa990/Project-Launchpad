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
    }
}
