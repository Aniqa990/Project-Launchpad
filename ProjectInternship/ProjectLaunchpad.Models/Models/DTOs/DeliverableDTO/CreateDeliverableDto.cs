using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.DeliverableDTO
{
    public class CreateDeliverableDto
    {
        [Required]
        public string UploadFiles { get; set; }

        [Required]
        public int MilestoneId { get; set; }

        [Required]
        public string Comment { get; set; }

        [Required]
        public string Status { get; set; }
    }

}
