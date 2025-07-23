using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO
{
    public class MilestoneWithUserDTO
    {
        public int? id { get; set; }
        public string? title { get; set; }
        public string? description { get; set; }
        public DateTime? dueDate { get; set; }
        public decimal? amount { get; set; }
        public MilestoneStatus? status { get; set; }

        public DateTime? submissionDate { get; set; }

        public string? submittedFileUrls { get; set; } // Optional: use separate table if needed

        public string? freelancerComments { get; set; }

        public bool isApproved { get; set; }
        public int projectId { get; set; }

        public int? freelancerId { get; set; }
        public int? clientId { get; set; }

        public string? freelancerFirstName { get; set; }
        public string? freelancerLastName { get; set; }
        public string? freelancerEmail { get; set; }
        public string? clientFirstName { get; set; }
        public string? clientLastName { get; set; }
        public string? clientEmail { get; set; }

    }
}
