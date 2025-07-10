using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class ProjectPostingDTO
    {
        public int Id { get; set; }

        public string ProjectTitle { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string? PaymentType { get; set; }

        public string CategoryOrDomain { get; set; } = string.Empty;

        public DateTime Deadline { get; set; }

        public TimeSpan Duration => Deadline - DateTime.Now;

        public string RequiredSkills { get; set; } = string.Empty;

        public decimal Budget { get; set; }

        public int NumberOfFreelancers { get; set; }

        public string? Milestones { get; set; }

        public string? AttachedDocumentPath { get; set; }
    }
}
