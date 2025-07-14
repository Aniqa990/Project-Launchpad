using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class ParsedResume
    {
        public int Id { get; set; }
        public int ResumeId { get; set; }
        public string ParsedJson { get; set; } = null!;
        public DateTime ParsedAt { get; set; }

        public Resume Resume { get; set; } = null!;
    }

}
