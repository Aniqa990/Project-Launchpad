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
using Newtonsoft.Json;
using ProjectLaunchpad.Models.Models.DTOs;

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




        [Function("ReleasePayment")]
        public async Task<HttpResponseData> ReleasePayment(
    [HttpTrigger(AuthorizationLevel.Function, "post", Route = "payments/release/{paymentId:int}")] HttpRequestData req,
    int paymentId)
        {
            var payment = await _unitOfWork.PaymentRepository.GetPaymentByIdAsync(paymentId);
            if (payment == null || payment.PaymentStatus != "Paid")
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                await notFound.WriteStringAsync("Payment not eligible for release.");
                return notFound;
            }

            payment.PaymentStatus = "Released";
            await _unitOfWork.PaymentRepository.UpdateAsync(payment);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("Payment released.");
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
                if (dto == null || dto.Amount <= 0 || dto.ClientId == 0 || dto.FreelancerId == 0 || dto.ProjectId == 0)
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    await response.WriteStringAsync("Invalid or missing payment data.");
                    return response;
                }

                // FIXED: Remove the milestoneId validation for fixed payments
                // Only validate milestoneId for milestone payments
                if (dto.PaymentType == "Milestone" && (dto.MilestoneId == null || dto.MilestoneId == 0))
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    await response.WriteStringAsync("Milestone payment requires a valid MilestoneId.");
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
                    MilestoneId = dto.MilestoneId, // Allow null for fixed payments
                    TimesheetId = dto.TimesheetId,
                    Amount = (decimal)dto.Amount,
                    PaymentDate = DateTime.UtcNow,
                    PaymentStatus = "Pending"
                };

                await _unitOfWork.PaymentRepository.AddPaymentAsync(newPayment);
                await _unitOfWork.SaveAsync();

                // Create Stripe Checkout Session
                var productName = dto.PaymentType == "Fixed"
                    ? $"Fixed Project Payment - Project #{dto.ProjectId}"
                    : $"Milestone Payment - Project #{dto.ProjectId}";

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
                            Name = productName,
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
                { "paymentType", dto.PaymentType },
                { "milestoneId", dto.MilestoneId?.ToString() ?? "" }
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

        [Function("GetPaymentsByFreelancerId")]
        public async Task<HttpResponseData> GetPaymentsByFreelancerId(
    [HttpTrigger(AuthorizationLevel.Function, "get", Route = "payments/freelancer/{freelancerId:int}")] HttpRequestData req,
    int freelancerId)
        {
            var response = req.CreateResponse();

            try
            {
                var payments = await _unitOfWork.PaymentRepository.GetPaymentsByFreelancerIdAsync(freelancerId);

                if (payments == null || !payments.Any())
                {
                    response.StatusCode = HttpStatusCode.NotFound;
                    await response.WriteStringAsync("No payments found for this freelancer.");
                    return response;
                }

                response.StatusCode = HttpStatusCode.OK;
                await response.WriteAsJsonAsync(payments);
                return response;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                await response.WriteStringAsync($"Error retrieving payments: {ex.Message}");
                return response;
            }
        }

        [Function("GetPaymentsByMilestoneId")]
        public async Task<HttpResponseData> GetPaymentsByMilestoneId(
    [HttpTrigger(AuthorizationLevel.Function, "get", Route = "payments/milestone/{milestoneId:int}")] HttpRequestData req,
    int milestoneId)
        {
            var response = req.CreateResponse();

            try
            {
                var payments = await _unitOfWork.PaymentRepository.GetPaymentsByMilestoneIdAsync(milestoneId);

                if (payments == null || !payments.Any())
                {
                    response.StatusCode = HttpStatusCode.NotFound;
                    await response.WriteStringAsync("No payments found for this milestone.");
                    return response;
                }

                response.StatusCode = HttpStatusCode.OK;
                await response.WriteAsJsonAsync(payments);
                return response;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                await response.WriteStringAsync($"Error retrieving payments: {ex.Message}");
                return response;
            }
        }

        [Function("CreateMultiFreelancerCheckoutSession")]
        public async Task<HttpResponseData> CreateMultiFreelancerCheckoutSession(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "payments/create-multi-freelancer-checkout-session")] HttpRequestData req)
        {
            var response = req.CreateResponse();

            try
            {
                // Create DTO for multi-freelancer payment
                var requestBody = await req.ReadFromJsonAsync<CreateMultiFreelancerPaymentDto>();
                if (requestBody == null || requestBody.TotalAmount <= 0 || requestBody.ClientId == 0 || requestBody.ProjectId == 0)
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    await response.WriteStringAsync("Invalid or missing payment data.");
                    return response;
                }

                // Validate milestone payment
                if (requestBody.PaymentType == "Milestone" && (requestBody.MilestoneId == null || requestBody.MilestoneId == 0))
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    await response.WriteStringAsync("Milestone payment requires a valid MilestoneId.");
                    return response;
                }

                // Validate freelancer payments array
                if (requestBody.FreelancerPayments == null || !requestBody.FreelancerPayments.Any())
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    await response.WriteStringAsync("At least one freelancer payment is required.");
                    return response;
                }

                // Validate total amount matches sum of individual amounts
                var totalCalculated = requestBody.FreelancerPayments.Sum(fp => fp.Amount);
                if (Math.Abs(totalCalculated - requestBody.TotalAmount) > 0.01m) // Allow small rounding differences
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    await response.WriteStringAsync($"Total amount ({requestBody.TotalAmount}) does not match sum of freelancer amounts ({totalCalculated}).");
                    return response;
                }

                StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

                // Save initial payment records in database for each freelancer
                var paymentIds = new List<int>();
                var freelancerPaymentData = new List<object>();

                foreach (var freelancerPayment in requestBody.FreelancerPayments)
                {
                    var newPayment = new Payment
                    {
                        ClientId = requestBody.ClientId,
                        FreelancerId = freelancerPayment.FreelancerId,
                        ProjectId = requestBody.ProjectId,
                        PaymentType = requestBody.PaymentType,
                        MilestoneId = requestBody.MilestoneId,
                        TimesheetId = requestBody.TimesheetId,
                        Amount = (decimal)freelancerPayment.Amount,
                        PaymentDate = DateTime.UtcNow,
                        PaymentStatus = "Pending"
                    };

                    await _unitOfWork.PaymentRepository.AddPaymentAsync(newPayment);
                    await _unitOfWork.SaveAsync();

                    paymentIds.Add(newPayment.Id);
                    freelancerPaymentData.Add(new
                    {
                        paymentId = newPayment.Id,
                        freelancerId = freelancerPayment.FreelancerId,
                        freelancerName = freelancerPayment.FreelancerName,
                        amount = freelancerPayment.Amount
                    });
                }

                // Create Stripe Checkout Session with line items for each freelancer
                var productName = requestBody.PaymentType == "Fixed"
                    ? $"Fixed Project Payment - Project #{requestBody.ProjectId}"
                    : $"Milestone Payment - Project #{requestBody.ProjectId}";

                var lineItems = new List<SessionLineItemOptions>();

                // Add line item for each freelancer
                foreach (var freelancerPayment in requestBody.FreelancerPayments)
                {
                    lineItems.Add(new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = "usd",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"{productName} - {freelancerPayment.FreelancerName}",
                                Description = $"Payment for {freelancerPayment.FreelancerName}"
                            },
                            UnitAmount = (long)(freelancerPayment.Amount * 100), // amount in cents
                        },
                        Quantity = 1,
                    });
                }

                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    LineItems = lineItems,
                    Mode = "payment",
                    SuccessUrl = $"http://localhost:5173/payment-success?paymentIds={string.Join(",", paymentIds)}",
                    CancelUrl = $"http://localhost:5173/payment-cancelled",
                    Metadata = new Dictionary<string, string>
            {
                { "paymentIds", string.Join(",", paymentIds) },
                { "projectId", requestBody.ProjectId.ToString() },
                { "paymentType", requestBody.PaymentType },
                { "milestoneId", requestBody.MilestoneId?.ToString() ?? "" },
                { "totalAmount", requestBody.TotalAmount.ToString() },
                { "freelancerCount", requestBody.FreelancerPayments.Count().ToString() },
                { "freelancerPayments", JsonConvert.SerializeObject(freelancerPaymentData) }
            }
                };

                var sessionService = new SessionService();
                var session = await sessionService.CreateAsync(options);

                // Update all payment records with Stripe session ID
                foreach (var paymentId in paymentIds)
                {
                    var payment = await _unitOfWork.PaymentRepository.GetPaymentByIdAsync(paymentId);
                    if (payment != null)
                    {
                        payment.TransactionReference = session.Id;
                        await _unitOfWork.PaymentRepository.UpdateAsync(payment);
                    }
                }
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

        [Function("AdminReleasePaymentAndApproveMilestone")]
        public async Task<HttpResponseData> AdminReleasePaymentAndApproveMilestone(
    [HttpTrigger(AuthorizationLevel.Function, "post", Route = "payments/admin-release/{paymentId:int}")] HttpRequestData req,
    int paymentId)
        {
            var response = req.CreateResponse();

            try
            {
                // Fetch payment by ID
                var payment = await _unitOfWork.PaymentRepository.GetPaymentByIdAsync(paymentId);
                if (payment == null)
                {
                    response.StatusCode = HttpStatusCode.NotFound;
                    await response.WriteStringAsync("Payment not found.");
                    return response;
                }

                if (payment.PaymentStatus == "Released")
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    await response.WriteStringAsync("Payment is already released.");
                    return response;
                }

                // Release payment
                payment.PaymentStatus = "Released";
                await _unitOfWork.PaymentRepository.UpdateAsync(payment);

                // Check if it's a milestone payment and update milestone status
                if (payment.PaymentType == "Milestone" && payment.MilestoneId.HasValue)
                {
                    var milestone = await _unitOfWork.MilestoneRepository.GetMilestoneByIdAsync(payment.MilestoneId.Value);
                    if (milestone != null)
                    {
                        await _unitOfWork.MilestoneRepository.UpdateHandoverStatusAsync(payment.MilestoneId.Value, "Approved");
                    }
                }

                await _unitOfWork.SaveAsync();

                response.StatusCode = HttpStatusCode.OK;
                await response.WriteStringAsync("Payment released and milestone approved (if applicable).");
                return response;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                await response.WriteStringAsync($"Error: {ex.Message}");
                return response;
            }
        }






    }
}
