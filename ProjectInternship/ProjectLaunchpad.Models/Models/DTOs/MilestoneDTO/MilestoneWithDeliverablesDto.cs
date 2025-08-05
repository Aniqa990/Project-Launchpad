using ProjectLaunchpad.Models.Models.DTOs.DeliverableDTO;
using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO
{
    public class MilestoneWithDeliverablesDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime DueDate { get; set; }
        public decimal Amount { get; set; }
        public MilestoneStatus Status { get; set; }
        public DateTime? SubmissionDate { get; set; }
        public string? FreelancerComments { get; set; }
        public bool IsApproved { get; set; }
        public string HandoverStatus { get; set; }
        public int ProjectId { get; set; }

        public List<DeliverableDto> Deliverables { get; set; } = new();
    }
}
