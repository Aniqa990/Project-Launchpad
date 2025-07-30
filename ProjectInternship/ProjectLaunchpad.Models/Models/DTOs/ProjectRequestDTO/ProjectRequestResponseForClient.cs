using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.ProjectRequestDTO
{
    public class ProjectRequestResponseForClient
    {
        public int ProjectId { get; set; }
        public int FreelancerId { get; set; }

        public string Status { get; set; }  // Pending, Accepted, Rejected
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    }
}
