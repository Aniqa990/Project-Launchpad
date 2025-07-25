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
using System.Security.Claims;
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
            var response = req.CreateResponse();

            try
            {
                var dto = await req.ReadFromJsonAsync<CreatePaymentDto>();
                if (dto == null || dto.Amount <= 0 || dto.ClientId == 0 || dto.FreelancerId == 0 || dto.ProjectId == 0 || dto.MilestoneId == 0)
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    await response.WriteStringAsync("Invalid or missing payment data.");
                    return response;
                }

                StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

                // Save initial payment record in database
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

                // Create Stripe Checkout Session
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
                            Name = $"Milestone Payment - Project #{dto.ProjectId}",
                        },
                        UnitAmount = (long)(dto.Amount * 100), // amount in cents
                    },
                    Quantity = 1,
                }
            },
                    Mode = "payment",
                    SuccessUrl = $"http://localhost:5173/payment-success?paymentId={newPayment.Id}",
                    CancelUrl = $"http://localhost:5173/payment-cancelled",
                    Metadata = new Dictionary<string, string>
            {
                { "paymentId", newPayment.Id.ToString() },
                { "projectId", dto.ProjectId.ToString() },
                { "milestoneId", dto.MilestoneId.ToString() }
            }
                };

                var sessionService = new SessionService();
                var session = await sessionService.CreateAsync(options);

                // Update payment with Stripe session ID
                newPayment.TransactionReference = session.Id;
                await _unitOfWork.PaymentRepository.UpdateAsync(newPayment);
                await _unitOfWork.SaveAsync();

                response.StatusCode = HttpStatusCode.OK;
                await response.WriteAsJsonAsync(new { url = session.Url });
                return response;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                await response.WriteStringAsync($"Stripe error: {ex.Message}");
                return response;
            }
        }





    }
}
