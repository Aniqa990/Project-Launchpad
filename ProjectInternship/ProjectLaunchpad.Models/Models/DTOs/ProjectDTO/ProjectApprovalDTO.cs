using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.ProjectDTO
{
    public class ProjectApprovalDTO
    {
        public int Id { get; set; }
        public string? ApprovalStatus { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? ApprovedAt { get; set; } = DateTime.Now;

    }
}
