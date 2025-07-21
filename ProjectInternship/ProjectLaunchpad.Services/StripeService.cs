using Microsoft.Extensions.Configuration;
using ProjectLaunchpad.Models.Models.DTOs.PaymentDTO;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Services
{
    public class StripeService:IStripeService
    {
        public StripeService(IConfiguration config)
        {
            StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
        }

        public async Task<PaymentIntent> CreatePaymentIntentAsync(CreatePaymentDto dto)
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(dto.Amount * 100), // USD cents
                Currency = "usd",
                Metadata = new Dictionary<string, string>
                {
                    { "ClientId", dto.ClientId.ToString() },
                    { "FreelancerId", dto.FreelancerId.ToString() },
                    { "ProjectId", dto.ProjectId.ToString() }
                }
            };

            var service = new PaymentIntentService();
            return await service.CreateAsync(options);
        }


    }
}
