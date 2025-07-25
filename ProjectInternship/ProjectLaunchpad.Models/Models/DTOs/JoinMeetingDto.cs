using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class JoinMeetingDto
    {
        public int MeetingId { get; set; }
        public int UserId { get; set; }

        public string UserName { get; set; }
        public string Role { get; set; } // "Client" or "Freelancer"
    }
}
