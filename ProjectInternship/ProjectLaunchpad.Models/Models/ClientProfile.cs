using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class ClientProfile
    {
        [Key, ForeignKey("User")]
        public int Id { get; set; }

        public User User { get; set; }

        // Navigation
        public ICollection<Project> Projects { get; set; }
       // public ICollection<ProjectRequest> RequestsSent { get; set; }
    }

}
