using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.FreelancerDTO
{
    public class ProfileSetupRequestDTO
    {
        public string? FirstName { get; set; } = string.Empty;
        public string? LastName { get; set; } = string.Empty;
        public string? PhoneNo { get; set; } = string.Empty;
        public decimal? HourlyRate { get; set; }
        public string? Availability { get; set; } = string.Empty;
        public string? WorkingHours { get; set; } = string.Empty;
        public string? ProfilePicture { get; set; }
        public ProfileSetupDTO? ProfileData { get; set; } = new ProfileSetupDTO();
        public string? Password { get; set; }
        public string? NewPassword { get; set; }
    }
}
