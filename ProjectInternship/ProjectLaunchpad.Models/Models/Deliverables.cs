using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Deliverables
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string uploadFiles { get; set; }

        [Required]
        public string comment { get; set; }

        [Required]
        public string Status  { get; set; }

        public int MilestoneId { get; set; }

        [ForeignKey("MilestoneId")]
        public Milestone? Milestone { get; set; }
    }
}
