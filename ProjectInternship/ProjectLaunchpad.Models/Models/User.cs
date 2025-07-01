using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string? FirstName { get; set; }

        [Required]
        public string? LastName { get; set; }

        [Required]
        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        public string? PhoneNo { get; set; }

        [Required]
        public string? Password { get; set; }

        [NotMapped] // <== this is important
        [Compare("Password", ErrorMessage = "Passwords do not match.")]
        public string? ConfirmPassword { get; set; }

        [Required]
        public string? Role { get; set; }  // e.g., "Client", "Freelancer"

        public string? Gender { get; set; } // Optional (Male/Female/Other/Prefer not to say)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Project> OwnedProjects { get; set; }  // As Client

        public ICollection<ProjectAssignment> ProjectAssignments { get; set; } // As Freelancer
    }
}
