using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class ProjectRequestDTO
    {
        public int ProjectId { get; set; }
        public int FreelancerId { get; set; }
        public string? ProjectTitle { get; set; }
        public string? ProjectDescription { get; set; }
        public string? ProjectCategory { get; set; }
        public DateTime? Deadline { get; set; }
        public string? Skills { get; set; }
        public decimal? Budget { get; set; }
        public int? ClientId { get; set; }
        public string? ClientName { get; set; }
        public string? ClientEmail { get; set; }
        public string? ClientPhoneNumber { get; set; }
        public string? ClientProfilePicture { get; set; }
        public string? Status { get; set; } = "Pending"; // Default status is "Pending"
        public DateTime? RequestedAt { get; set; } = DateTime.UtcNow;

    }
}
