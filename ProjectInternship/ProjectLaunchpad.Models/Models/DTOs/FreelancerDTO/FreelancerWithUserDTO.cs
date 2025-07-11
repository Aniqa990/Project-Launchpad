using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class FreelancerWithUserDTO
    {
        public User User { get; set; }
        public FreelancerProfile Profile { get; set; }
    }
}
