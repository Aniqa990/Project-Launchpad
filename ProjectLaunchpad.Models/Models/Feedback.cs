using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Feedback
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ClientId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int FreelancerId { get; set; }

        [Required]
        public string Review { get; set; } = string.Empty;

        [Required]
        public string Rating { get; set; } = string.Empty; // e.g., "Excellent", "Good", etc.
    }
}
