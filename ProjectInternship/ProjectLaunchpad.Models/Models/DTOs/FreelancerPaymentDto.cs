using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs
{
    public class FreelancerPaymentDto
    {
        public int FreelancerId { get; set; }
        public string FreelancerName { get; set; }
        public decimal Amount { get; set; }
    }
}
