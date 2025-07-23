using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class MeetingAudioRecording
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MeetingId { get; set; }
        
        [ForeignKey("MeetingId")]
        public Meeting? Meeting { get; set; }

        [Required]
        public int UserId { get; set; }

        public User? user { get; set; } 

        [Required]
        public string? AudioUrl { get; set; }

        public DateTime UploadedAt { get; set; }
    }
}
