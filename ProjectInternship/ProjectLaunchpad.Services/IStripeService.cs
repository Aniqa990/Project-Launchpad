using ProjectLaunchpad.Models.Models.DTOs.PaymentDTO;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Services
{
    public interface IStripeService
    {
        Task<PaymentIntent> CreatePaymentIntentAsync(CreatePaymentDto dto);

    }
}
