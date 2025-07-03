using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.DeliverableDTO
{
    public class CreateDeliverableDto
    {
        public string? uploadFiles { get; set; }
        public int projectId { get; set; }
        public string? comment { get; set; }
        public string? status { get; set; }
    }
}
