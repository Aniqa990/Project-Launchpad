using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Feedback
    {

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int FreelancerId { get; set; }

        [Required]
        public string Review { get; set; } = string.Empty; // e.g., "Excellent", "Good", etc.

        [Required]
        public decimal Rating { get; set; }

        public Project Project { get; set; }
        public FreelancerProfile Freelancer { get; set; }
    }
}