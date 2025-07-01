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
        public int ClientId { get; set; }
    }
}
