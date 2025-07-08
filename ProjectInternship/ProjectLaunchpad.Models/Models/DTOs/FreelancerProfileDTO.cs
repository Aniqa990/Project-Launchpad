using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class FreelancerProfileDTO
    {
        public int Id { get; set; } 
        public string? Skills { get; set; }
        public string? Experience { get; set; }
        public decimal? HourlyRate { get; set; }
        public decimal? AvgRating { get; set; }
        public string? Availability { get; set; }
        public string? WorkingHours { get; set; }
        public string? Summary { get; set; }
        public string? Projects { get; set; }
    }
}
