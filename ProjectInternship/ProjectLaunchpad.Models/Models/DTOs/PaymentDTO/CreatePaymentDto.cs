using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.PaymentDTO
{
    public class CreatePaymentDto
    {
        public int ClientId { get; set; }
        public int FreelancerId { get; set; }
        public int ProjectId { get; set; }
        public string? PaymentType { get; set; }
        public int? MilestoneId { get; set; }
        public int? TimesheetId { get; set; }
        public double Amount { get; set; }
    }
}
