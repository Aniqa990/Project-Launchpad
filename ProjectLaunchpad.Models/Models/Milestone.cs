using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Milestone
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public MilestoneStatus Status { get; set; } 

        public DateTime? SubmissionDate { get; set; }

        public string? SubmittedFileUrls { get; set; } // Optional: use separate table if needed

        public string? FreelancerComments { get; set; }

        public bool IsApproved { get; set; } = false;

        // Foreign key to be added once the project is merge with other modules
        public int ProjectId { get; set; }

        
    }
}
