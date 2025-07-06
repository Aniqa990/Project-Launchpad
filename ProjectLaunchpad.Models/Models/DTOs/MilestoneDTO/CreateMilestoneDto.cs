using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO
{
    public class CreateMilestoneDto
    {
        
            [Required]
            public string? Title { get; set; }

            [Required]
            public string? Description { get; set; }

            [Required]
            public DateTime DueDate { get; set; }

            [Required]
            public decimal Amount { get; set; }

            [Required]
            public int ProjectId { get; set; }
        

    }
}
