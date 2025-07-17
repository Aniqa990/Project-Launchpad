using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO
{
    public class SubmitMilestoneDto
    {
        [Required]
        public int MilestoneId { get; set; }

        public DateTime SubmissionDate { get; set; } = DateTime.UtcNow;

        public string? SubmittedFileUrls { get; set; }

        public string? FreelancerComments { get; set; }
    }
}
