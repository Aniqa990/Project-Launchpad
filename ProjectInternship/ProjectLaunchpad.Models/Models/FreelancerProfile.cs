using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models
{
    public class FreelancerProfile
    {

        [Key, ForeignKey("User")]
        public int Id { get; set; }
        public User User { get; set; }

        [Required]
        public string Skills { get; set; }

        [Required]
        public string Experience { get; set; }

        public decimal HourlyRate { get; set; }

        [Required]
        public string Availability { get; set; }

        [Required]
        public string WorkingHours { get; set; }

        public decimal AvgRating { get; set; }

        public string Summary { get; set; }
        public string Projects { get; set; }

        public ICollection<ProjectAssignment> ProjectAssignments { get; set; } // As Freelancer

        public ICollection<ProjectRequest> ProjectRequests { get; set; } // Requests for project assignments
        public ICollection<Feedback> Feedbacks { get; set; } // Feedback given by clients

    }
}
