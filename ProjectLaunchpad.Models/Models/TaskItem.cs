using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class TaskItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string? Description { get; set; }

        public DateTime? EstimatedDeadline { get; set; }

        [Required]
        public KanbanTaskPriorityLevel Priority { get; set; } // Enum: Low, Medium, High, Urgent

        [Required]
        public KanbanTaskStatus Status { get; set; } // Enum: ToDo, InProgress, Done

        public int CreatedByUserId { get; set; } // Creator (could be freelancer)

        [ForeignKey("CreatedByUserId")]
        public User CreatedByUser { get; set; }

        [Required]
        public int AssignedToUserId { get; set; } // Who is responsible

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Subtask> Subtasks { get; set; } = new List<Subtask>();
    }
}
