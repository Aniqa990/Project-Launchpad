using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Project
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public string Category { get; set; }

        [Required]
        public DateOnly Deadline { get; set; }

        [Required]
        public string SkillsRequired { get; set; }

        [Required]
        public decimal Budget { get; set; }

        [Required]
        public string Status { get; set; } = "Active";

        [Required]
        public int ClientId { get; set; }

        [ForeignKey("ClientId")]
        public User Client { get; set; }

        public ICollection<ProjectAssignment> AssignedFreelancers { get; set; }
    }

}
