using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class CreateMultiFreelancerPaymentDto
    {
        public int ClientId { get; set; }
        public int ProjectId { get; set; }
        public string PaymentType { get; set; }
        public int? MilestoneId { get; set; }
        public int? TimesheetId { get; set; }
        public decimal TotalAmount { get; set; }
        public List<FreelancerPaymentDto> FreelancerPayments { get; set; }
    }
}
