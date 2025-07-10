using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class FeedbackCreateDTO
    {
        public int ClientId { get; set; }
        public int ProjectId { get; set; }
        public int FreelancerId { get; set; }
        public string Review { get; set; } = string.Empty;
        public string Rating { get; set; } = string.Empty; // e.g., "Excellent", "Good"
    }
}
