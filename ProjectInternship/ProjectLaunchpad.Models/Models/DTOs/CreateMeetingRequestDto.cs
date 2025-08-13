using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class CreateMeetingRequestDto
    {
        public int ProjectId { get; set; }
        public string Title { get; set; }         // NEW
        public string Description { get; set; }   // NEW
        public string Agenda { get; set; }        // NEW
        public int CreatedBy { get; set; }        // NEW (ClientId)
        public List<MeetingParticipantDto> Participants { get; set; } // NEW

    }
}
