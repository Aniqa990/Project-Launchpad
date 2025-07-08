using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class ProjectDTO
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public DateOnly Deadline { get; set; }
        public string? SkillsRequired { get; set; }
        public decimal? Budget { get; set; }
        public string? Status { get; set; } = "Active"; // Default status is "Active"

        public int? ClientId { get; set; }
    }
}
