using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using Stripe;
using Stripe.Checkout;
using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Newtonsoft.Json;


namespace ProjectLaunchpad.Functions
{
    public class StripeWebhookFunctions
    {
        private readonly IConfiguration _config;
        private readonly IUnitOfWork _unitOfWork;

        public StripeWebhookFunctions(IConfiguration configuration, IUnitOfWork unitOfWork)
        {
            _config = configuration;
            _unitOfWork = unitOfWork;
        }

        [Function("StripeWebhook")]
        public async Task<HttpResponseData> StripeWebhook(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "webhooks/stripe")] HttpRequestData req,
            FunctionContext context)
        {
            var logger = context.GetLogger("StripeWebhook");

            // Read request body
            var json = await new StreamReader(req.Body).ReadToEndAsync();

            // Get Stripe signature from header
            var stripeSignature = req.Headers.TryGetValues("Stripe-Signature", out var values)
                ? values.FirstOrDefault()
                : null;

            var webhookSecret = _config["Stripe:WebhookSecret"];
            StripeConfiguration.ApiKey = _config["Stripe:SecretKey"]; // ✅ important

            if (string.IsNullOrEmpty(stripeSignature) || string.IsNullOrEmpty(webhookSecret))
            {
                var badRes = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRes.WriteStringAsync("Missing signature or webhook secret");
                return badRes;
            }

            Stripe.Event stripeEvent;
            try
            {
                stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, webhookSecret, throwOnApiVersionMismatch: false);

                logger.LogInformation($"🔔 Received event: {stripeEvent.Type}");
            }
            catch (Exception ex)
            {
                logger.LogError($"❌ Webhook signature verification failed: {ex.Message}");
                var res = req.CreateResponse(HttpStatusCode.BadRequest);
                await res.WriteStringAsync("Invalid signature");
                return res;
            }

            // Only handle checkout.session.completed
            if (stripeEvent.Type == "checkout.session.completed")
            {
                try
                {
                    // ✅ Correct way to get session object as JSON
                    var sessionJson = JsonConvert.SerializeObject(stripeEvent.Data.Object);
                    var checkoutSession = JsonConvert.DeserializeObject<Session>(sessionJson);

                    if (checkoutSession?.Metadata != null && checkoutSession.Metadata.ContainsKey("paymentId"))
                    {
                        var paymentIdStr = checkoutSession.Metadata["paymentId"];
                        logger.LogInformation($"📦 Metadata.paymentId: {paymentIdStr}");

                        if (int.TryParse(paymentIdStr, out int paymentId))
                        {
                            var payment = await _unitOfWork.PaymentRepository.GetPaymentByIdAsync(paymentId);
                            if (payment != null)
                            {
                                payment.PaymentStatus = "Paid";
                                await _unitOfWork.PaymentRepository.UpdateAsync(payment);
                                await _unitOfWork.SaveAsync();
                                logger.LogInformation($"✅ Payment #{paymentId} marked as Paid.");
                            }
                            else
                            {
                                logger.LogWarning($"⚠️ No payment found with ID: {paymentId}");
                            }
                        }
                        else
                        {
                            logger.LogWarning("❗ paymentId in metadata is not a valid integer");
                        }
                    }
                    else
                    {
                        logger.LogWarning("❗ Metadata missing or paymentId not found in session");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError($"❌ Exception while processing webhook: {ex.Message}");
                }
            }


            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("Webhook handled successfully");
            return response;
        }
    }
}
