using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.LogDTO
{
    public class CreateLogDto
    {
        public int FreelancerId { get; set; }
        public int TaskId { get; set; }

        // Optional: Let backend set StartTime (e.g., DateTime.UtcNow)
        public DateTime? StartTime { get; set; }

    }
}
