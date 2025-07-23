using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IMeetingAudioRecordingRepository
    {
        Task AddAsync(MeetingAudioRecording entity);


    }
}
