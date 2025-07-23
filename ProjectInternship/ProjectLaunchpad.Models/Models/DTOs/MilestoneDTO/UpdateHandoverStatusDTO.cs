using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO
{
    public class UpdateHandoverStatusDTO
    {
        public int MilestoneId { get; set; }
        public string HandoverStatus { get; set; } // "pending", "completed"
    }
}
