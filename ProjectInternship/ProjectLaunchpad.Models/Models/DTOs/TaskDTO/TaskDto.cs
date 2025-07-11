using ProjectLaunchpad.Models.Models.DTOs.AuthenticationDTO;
using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.TaskDTO
{
    public class TaskDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? EstimatedDeadline { get; set; }
        public KanbanTaskPriorityLevel Priority { get; set; }
        public KanbanTaskStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }

        public UserRegisterDTO CreatedByUser { get; set; }
        public UserRegisterDTO AssignedToUser { get; set; }

        public List<SubtaskDto> Subtasks { get; set; } = new();
    }
}
