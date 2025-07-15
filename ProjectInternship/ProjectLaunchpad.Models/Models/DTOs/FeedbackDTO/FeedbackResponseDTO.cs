using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.FeedbackDTO
{
    public class FeedbackResponseDTO
    {
        public int ProjectId { get; set; }
        public int FreelancerId { get; set; }
        public string ClientName { get; set; }
        public string ProjectName { get; set; }
        public string Review { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
