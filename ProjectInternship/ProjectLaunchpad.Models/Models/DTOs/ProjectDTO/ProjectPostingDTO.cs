using ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.ProjectDTO
{
    public class ProjectPostingDTO
    {
        public int Id { get; set; }

        public string ProjectTitle { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string? PaymentType { get; set; }

        public string CategoryOrDomain { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }

        public DateTime Deadline { get; set; }

        public TimeSpan Duration => Deadline - DateTime.Now;

        public string RequiredSkills { get; set; } = string.Empty;

        public decimal Budget { get; set; }

        public int NumberOfFreelancers { get; set; }

        public string? Status { get; set; } = "open"; // Open, Closed, active

        public string? AttachedDocumentPath { get; set; }

        // Add this line 👇
        public List<CreateMilestoneDto>? Milestones { get; set; }
    }
}