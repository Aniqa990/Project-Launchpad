using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class TimeSheetResponseDTO
    {
        public int Id { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string FreelancerName { get; set; } = string.Empty;
        public DateTime DateOfWork { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public double TotalHours { get; set; }
        public string WorkDescription { get; set; } = string.Empty;
        public decimal HourlyRate { get; set; }
        public decimal CalculatedAmount { get; set; }
        public string ApprovalStatus { get; set; } = string.Empty;
        public string? ReviewerComments { get; set; }
    }
}