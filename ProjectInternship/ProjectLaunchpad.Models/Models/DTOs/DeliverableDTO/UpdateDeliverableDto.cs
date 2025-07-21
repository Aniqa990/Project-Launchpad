using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.DeliverableDTO
{
    public class UpdateDeliverableDto
    {
        public string? UploadFiles { get; set; }
        public int? MilestoneId { get; set; }
        public int? ProjectId { get; set; }
        public string? Comment { get; set; }
        public string? Status { get; set; }
    }
}
