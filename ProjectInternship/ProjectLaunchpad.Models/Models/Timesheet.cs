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

        [Required]
        public string ProjectName { get; set; } = string.Empty;

        [Required]
        public string FreelancerName { get; set; } = string.Empty;

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