using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models
{
    public class User
    {
        public int Id { get; set; }
        public required string  FirstName { get; set; }

        public required string LastName { get; set; }

        public required string Email { get; set; }

        public required string Password { get; set; }

        public required string PhoneNumber { get; set; }

        public required string Location { get; set; }

        public required string Gender { get; set; }

        public string? ProfilePictureUrl { get; set; }

    }
}
