using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.FreelancerDTO
{
    public class ProfileSetupRequestDTO
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public decimal HourlyRate { get; set; }
        public string Availability { get; set; } = string.Empty;
        public string WorkingHours { get; set; } = string.Empty;
        public ProfileSetupDTO ProfileData { get; set; } = new ProfileSetupDTO();
    }
}
