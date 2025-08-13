using ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.ProjectDTO
{
    public class ProjectUpdateDTO
    {
        public string? ProjectTitle { get; set; }
        public string? Description { get; set; }
        public string? CategoryOrDomain { get; set; }
        public decimal? Budget { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? Deadline { get; set; }
        public string? RequiredSkills { get; set; }
        public int? NumberOfFreelancers { get; set; }
        public string? AttachedDocumentPath { get; set; }
        public string? ApprovalStatus { get; set; }

        // Milestone operations
        public List<CreateMilestoneDto>? MilestonesToAdd { get; set; }
        public List<int>? MilestoneIdsToDelete { get; set; }
    }
}
