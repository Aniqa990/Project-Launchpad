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
    public class Subtask
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }

        public KanbanSubtaskStatus Status { get; set; } = KanbanSubtaskStatus.ToDo; // Enum: ToDo, InProgress, Done

        public int TaskItemId { get; set; } // FK

        [ForeignKey("TaskItemId")]
        public TaskItem TaskItem { get; set; }
    }
}
