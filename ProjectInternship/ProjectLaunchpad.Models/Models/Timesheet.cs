using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;


namespace ProjectLaunchpad.Models.Models
{
    public class TimeSheet
    {
        [Key]
        public int Id { get; set; }

        public int ProjectId { get; set; }
        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        public int FreelancerId { get; set; }
        [ForeignKey("FreelancerId")]
        public FreelancerProfile Freelancer { get; set; }

        [Required]
        public DateTime DateOfWork { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        [NotMapped]
        public double TotalHours => (EndTime - StartTime).TotalHours;

        [Required]
        public string WorkDescription { get; set; } = string.Empty;

        [Required]
        public decimal HourlyRate { get; set; }

        [NotMapped]
        public decimal CalculatedAmount => (decimal)TotalHours * HourlyRate;

        [Required]
        public string ApprovalStatus { get; set; } = "Pending"; // Approved, Rejected, Pending

        public string? ReviewerComments { get; set; }
    }
}