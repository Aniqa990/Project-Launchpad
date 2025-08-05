using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models.DTOs.PaymentDTO
{
    public class AdminReleasePaymentDto
    {
        public int PaymentId { get; set; }
        public int? MilestoneId { get; set; }
        public string PaymentType { get; set; }
        public bool ReleaseAllMilestonePayments { get; set; } = true;
    }

    public class ReleasePaymentResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int ReleasedPaymentsCount { get; set; }
        public int MilestoneId { get; set; }
    }
} 