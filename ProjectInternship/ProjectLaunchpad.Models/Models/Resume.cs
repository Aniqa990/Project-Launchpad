using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Resume
    {
        public int Id { get; set; }
        public string Filename { get; set; } = null!;
        public byte[] FileData { get; set; } = null!;
        public DateTime UploadedAt { get; set; }
        public FreelancerProfile FreelancerProfile { get; set; }
    }

}
