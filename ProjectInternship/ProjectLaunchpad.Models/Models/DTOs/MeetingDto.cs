using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class MeetingDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string MeetingRoomId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Agenda { get; set; }
        public int ClientId { get; set; }
        public string Status { get; set; }
        public string RecordingUrl { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }

        public List<MeetingParticipantDto> Participants { get; set; }
    }
}
