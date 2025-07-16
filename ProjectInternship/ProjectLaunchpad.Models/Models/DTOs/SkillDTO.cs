using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class SkillDTO
    {
        public int Id { get; set; }
        public string SkillName { get; set; } = null!;
        public string Source { get; set; } = "parsed";
    }

}
