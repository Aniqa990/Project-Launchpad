using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.TaskDTO
{
    public class AiTaskDto
    {
        public string title { get; set; } = string.Empty;  // Changed from Title
        public string description { get; set; } = string.Empty;  // Changed from Description
        public string estimated_deadline { get; set; } = string.Empty;  // Changed from EstimatedDeadline
        public int priority { get; set; }  // Changed from Priority
        public int status { get; set; }  // Changed from Status
        public int created_by_id { get; set; }  // Changed from CreatedById
        public int freelancer_id { get; set; }  // Changed from FreelancerId
        public string project_id { get; set; } = string.Empty;  // Changed from ProjectId
    }
}
