using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class ProjectPosting
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ProjectTitle { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public string? PaymentType { get; set; }

        [Required]
        public string CategoryOrDomain { get; set; } = string.Empty;

        [Required]
        public DateTime Deadline { get; set; }

        [NotMapped]
        public TimeSpan Duration => Deadline - DateTime.Now; // Calculated at runtime

        [Required]
        public string RequiredSkills { get; set; } = string.Empty;

        [Required]
        public decimal Budget { get; set; } // Total or per freelancer, based on business logic

        [Required]
        public int NumberOfFreelancers { get; set; }


        public string Milestones { get; set; }


        public string? AttachedDocumentPath { get; set; }
    }
}
