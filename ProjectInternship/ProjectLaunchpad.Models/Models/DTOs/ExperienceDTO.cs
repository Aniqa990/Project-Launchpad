using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class ExperienceDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string Company { get; set; } = null!;
        public string StartDate { get; set; } = null!;
        public string EndDate { get; set; } = null!;
        public string? Description { get; set; }
        public string Source { get; set; } = "parsed";
    }

}
