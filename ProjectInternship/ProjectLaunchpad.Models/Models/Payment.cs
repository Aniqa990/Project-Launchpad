using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }
        public int ProjectId { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }
        public int FreelancerId { get; set; }

        [ForeignKey("FreelancerId")]
        public FreelancerProfile Freelancer { get; set; }

        // Milestone or Hourly — should match Project.PaymentType
        public string? PaymentType { get; set; }

        // Optional references (only one should be used depending on PaymentType)
        //fk
        public int? MilestoneId { get; set; }
        //fk
        public int? TimesheetId { get; set; }

        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }

        public string? PaymentStatus { get; set; } // Pending / Paid / Failed
        public string? TransactionReference { get; set; }

    }
}
