using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Project
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
        public TimeSpan Duration => Deadline - DateTime.Now;

        [Required]
        public string RequiredSkills { get; set; } = string.Empty;

        [Required]
        public decimal Budget { get; set; } 

        [Required]
        public int NumberOfFreelancers { get; set; }
        public string? Status { get; set; } = "Open"; // Open, Closed, In Progress

        public string? AttachedDocumentPath { get; set; }
        [Required]
        public int ClientId { get; set; }

        [ForeignKey("ClientId")]
        public ClientProfile Client { get; set; }

        public ICollection<ProjectAssignment> AssignedFreelancers { get; set; }

        public ICollection<ProjectRequest> ProjectRequests { get; set; }
        public ICollection<Milestone> Milestones { get; set; }

        public ICollection<Feedback> Feedbacks { get; set; }
        public ICollection<Deliverables> Deliverables { get; set; }
        public ICollection<TimeSheet> TimeSheets { get; set; }
    }
}