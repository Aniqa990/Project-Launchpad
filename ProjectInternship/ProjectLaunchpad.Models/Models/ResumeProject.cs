using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class ResumeProject
    {
        public int Id { get; set; }
        public int FreelancerId { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Source { get; set; } = "parsed";

        public FreelancerProfile Freelancer { get; set; } = null!;
    }

}
