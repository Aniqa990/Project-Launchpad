using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class MeetingParticipantDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string Role { get; set; } // "client" or "freelancer"
    }
}
