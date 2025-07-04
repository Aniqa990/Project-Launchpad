using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.TaskDTO
{
    public class CreateTaskDto
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTime? EstimatedDeadline { get; set; }
        public KanbanTaskPriorityLevel Priority { get; set; }
        public int CreatedByUserId { get; set; }
        public int AssignedToUserId { get; set; }
    }
}
