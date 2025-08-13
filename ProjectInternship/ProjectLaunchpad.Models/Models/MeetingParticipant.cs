using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class MeetingParticipant
    {
        [Key]
        public int Id { get; set; }

        public int MeetingId { get; set; }
        [ForeignKey("MeetingId")]
        public Meeting Meeting { get; set; }


        public int UserId { get; set; } // client or freelancer

        [ForeignKey("UserId")]
        public User? User { get; set; } // client or freelancer
        public string UserName { get; set; }

        public string role { get; set; }

        public DateTime? InviteSentAt { get; set; }      // NEW
        public bool NotificationRead { get; set; }       // NEW

        public DateTime? JoinedAt { get; set; }

        public DateTime? LeftAt { get; set; }
    }
}
