using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class FreelancerMilestone
    {
        [Key]
        public int Id { get; set; }

        // Foreign key to User (Freelancer)
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        // Foreign key to Milestone
        public int MilestoneId { get; set; }

        [ForeignKey("MilestoneId")]
        public Milestone Milestone { get; set; }

        public DateTime AssignedAt { get; set; }
    }
}
