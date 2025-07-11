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
    public class Logs
    {
        [Key]
        public int Id { get; set; }

        public int FreelancerId { get; set; }

        [ForeignKey("FreelancerId")]
        public FreelancerProfile? Freelancer { get; set; }

        public int TaskId { get; set; }

        [ForeignKey("TaskId")]
        public TaskItem? Task { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }



    }
}
