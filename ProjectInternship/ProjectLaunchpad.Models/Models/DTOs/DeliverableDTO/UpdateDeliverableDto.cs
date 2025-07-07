using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.DeliverableDTO
{
    public class UpdateDeliverableDto
    {
        public string? uploadFiles { get; set; }  // optional
        public int? projectId { get; set; }       // optional
        public string? comment { get; set; }      // optional
        public string? status { get; set; }       // optional
    }
}
