using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.FreelancerProfile
{
    public class FreelancerProfileDTO
    {
        public string? Skills { get; set; }
        public decimal? HourlyRate { get; set; }
        public decimal? FixedRate { get; set; }
        public decimal? AvgRating { get; set; }
        public string? Availability { get; set; }
        public string? WorkingHours { get; set; }
    }
}
