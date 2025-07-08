using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    //once the project is merged then all the fk must be added
    public class Payment
    {
        [Key]
        public int Id { get; set; }

        //fk
        public int ClientId { get; set; }

        //fk
        public int ProjectId { get; set; }
        //fk
        public int FreelancerId { get; set; }

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
