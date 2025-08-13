using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Meeting
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public string MeetingRoomId { get; set; }  // e.g., "proj-45-meeting-1"

        public string Title { get; set; }          // NEW
        public string Description { get; set; }    // NEW
        public string Agenda { get; set; }         // NEW

        public int ClientId { get; set; }        // NEW (ClientId, previously CreatedBy)
        
        [ForeignKey("ClientId")]
        public User Client { get; set; }         // NEW (ClientId)
        public string Status { get; set; }         // NEW (e.g., "Scheduled", "Ongoing", "Ended")

        public string RecordingUrl { get; set; }

        public DateTime StartedAt { get; set; }

        public DateTime? EndedAt { get; set; }

        public virtual ICollection<MeetingParticipant> Participants { get; set; }
    }
}
