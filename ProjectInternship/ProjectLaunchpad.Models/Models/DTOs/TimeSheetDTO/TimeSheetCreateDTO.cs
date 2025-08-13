using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class TimeSheetCreateDTO
    {
        public int ProjectId { get; set; }
        public int FreelancerId { get; set; }
        public DateTime DateOfWork { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string WorkDescription { get; set; } = string.Empty;
        public decimal HourlyRate { get; set; }
    }
}