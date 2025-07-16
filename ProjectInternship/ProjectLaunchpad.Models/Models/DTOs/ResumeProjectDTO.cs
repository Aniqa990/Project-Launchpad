using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class ResumeProjectDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Source { get; set; } = "parsed";
    }

}
