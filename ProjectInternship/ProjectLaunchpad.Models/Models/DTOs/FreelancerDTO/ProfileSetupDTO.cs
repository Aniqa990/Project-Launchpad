using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.FreelancerDTO
{
    public class ProfileSetupDTO
    {
        public string Summary { get; set; } = string.Empty;
        public List<SkillDTO> Skills { get; set; } = new List<SkillDTO>();
        public List<ResumeProjectDTO> Projects { get; set; } = new List<ResumeProjectDTO>();
        public List<ExperienceDTO> Experience { get; set; } = new List<ExperienceDTO>();

    }
}
