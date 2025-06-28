using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models
{
    public class FreelancerProfile
    {

        public int Id { get; set; }
        public required string Skills { get; set; }
        public decimal HourlyRate { get; set; }
        public decimal FixedRate { get; set; }
        public required string Availability { get; set; }
        public required string WorkingHours { get; set; }
        public decimal AvgRating { get; set; }
    
    }
}
