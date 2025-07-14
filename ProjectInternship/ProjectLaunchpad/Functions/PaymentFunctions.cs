using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.PaymentDTO;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Services;
using Stripe.Checkout;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace ProjectLaunchpad.Functions
{
    public class PaymentFunctions
    {
        private readonly IStripeService _stripeService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration config;

        public PaymentFunctions(IStripeService stripeService, IUnitOfWork unitOfWork,IConfiguration configuration)
        {
            _stripeService = stripeService;
            _unitOfWork = unitOfWork;
            config = configuration;
        }

        [Function("CreateStripePaymentIntent")]
        public async Task<HttpResponseData> CreateStripePaymentIntent(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "payments/create-intent")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreatePaymentDto>();
            if (dto == null || dto.Amount <= 0)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync("Invalid Payment Data");
                return bad;
            }

            var intent = await _stripeService.CreatePaymentIntentAsync(dto);

            var newPayment = new Payment
            {
                ClientId = dto.ClientId,
                FreelancerId = dto.FreelancerId,
                ProjectId = dto.ProjectId,
                PaymentType = dto.PaymentType,
                MilestoneId = dto.MilestoneId,
                TimesheetId = dto.TimesheetId,
                Amount = (decimal)dto.Amount,
                PaymentDate = DateTime.UtcNow,
                PaymentStatus = "Pending",
                TransactionReference = intent.Id // correct Stripe reference
            };

            await _unitOfWork.PaymentRepository.AddPaymentAsync(newPayment);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { clientSecret = intent.ClientSecret });
            return response;
        }

        [Function("CreateStripeCheckoutSession")]
        public async Task<HttpResponseData> CreateStripeCheckoutSession(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "payments/create-checkout-session")] HttpRequestData req)
        {
            try
            {
                var dto = await req.ReadFromJsonAsync<CreatePaymentDto>();
                if (dto == null || dto.Amount <= 0)
                {
                    var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                    await bad.WriteStringAsync("Invalid Payment Data");
                    return bad;
                }

                StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

                // Save payment in DB with status Pending
                var newPayment = new Payment
                {
                    ClientId = dto.ClientId,
                    FreelancerId = dto.FreelancerId,
                    ProjectId = dto.ProjectId,
                    PaymentType = dto.PaymentType,
                    MilestoneId = dto.MilestoneId,
                    TimesheetId = dto.TimesheetId,
                    Amount = (decimal)dto.Amount,
                    PaymentDate = DateTime.UtcNow,
                    PaymentStatus = "Pending"
                };

                await _unitOfWork.PaymentRepository.AddPaymentAsync(newPayment);
                await _unitOfWork.SaveAsync();

                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Payment for Project #{dto.ProjectId}",
                        },
                        UnitAmount = (long)(dto.Amount * 100),
                    },
                    Quantity = 1,
                }
            },
                    Mode = "payment",
                    SuccessUrl = $"http://localhost:5173/payment-success?paymentId={newPayment.Id}",
                    CancelUrl = "http://localhost:5173/payment-cancelled",
                    Metadata = new Dictionary<string, string>
            {
                { "paymentId", newPayment.Id.ToString() }
            }
                };

                var sessionService = new SessionService();
                var session = await sessionService.CreateAsync(options);

                // Save Stripe session ID as transaction ref
                newPayment.TransactionReference = session.Id;
                await _unitOfWork.PaymentRepository.UpdateAsync(newPayment);
                await _unitOfWork.SaveAsync();

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(new { url = session.Url });
                return response;
            }
            catch (Exception ex)
            {
                var response = req.CreateResponse(HttpStatusCode.InternalServerError);
                await response.WriteStringAsync($"Error: {ex.Message}");
                return response;
            }
        }




    }
}
