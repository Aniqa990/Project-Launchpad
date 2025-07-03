using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class FreelancerProfile
    {
        [Key, ForeignKey("User")]
        public int Id { get; set; }
        public User User { get; set; }

        [Required]
        public string Skills { get; set; }

        public decimal? HourlyRate { get; set; }
        public decimal? FixedRate { get; set; }
        [Required]
        public string Availability { get; set; }

        [Required]
        public string WorkingHours { get; set; }
        public decimal AvgRating { get; set; }
    }
}
