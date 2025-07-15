using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.FreelancerDTO
{
    public class ProfileSetupDTO
    {
        public string Summary { get; set; }
        public List<SkillDTO> Skills { get; set; }
        public List<ExperienceDTO> Experience { get; set; }
        public List<ResumeProjectDTO> Projects { get; set; }
    }
}
