using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class ProjectRequest
    {
        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int FreelancerId { get; set; }

        public string Status { get; set; }  // Pending, Accepted, Rejected
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Project Project { get; set; }
        public FreelancerProfile Freelancer { get; set; }
    }
}
