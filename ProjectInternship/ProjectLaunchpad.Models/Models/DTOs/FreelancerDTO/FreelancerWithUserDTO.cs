using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class FreelancerWithUserDTO
    {
        public int? Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? NewPassword { get; set; }
        public string? PhoneNo { get; set; }
        public string? Gender { get; set; }
        public string? ProfilePicture { get; set; }
        public string? Role { get; set; }
        public DateTime? CreatedAt { get; set; }
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
