using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class MeetingAudioRecordingResponseDto

    {

        public int Id { get; set; }

        public int MeetingId { get; set; }

        public string FilePath { get; set; }

        public DateTime UploadedAt { get; set; }

        public int UserId { get; set; }

        public string Username { get; set; }

    }

}
