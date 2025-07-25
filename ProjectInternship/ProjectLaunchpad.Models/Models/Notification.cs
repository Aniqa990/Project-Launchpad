using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; } // client or freelancer

        public string? Type { get; set; } // e.g., "MeetingInvite"

        public string? Message { get; set; }

        public int? RelatedMeetingId { get; set; } // For meeting invites

        public DateTime CreatedAt { get; set; }
        public bool Read { get; set; }
    }
}
