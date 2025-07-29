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

// Add this DTO class to your DTOs folder
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

public class FreelancerPaymentDto
{
    public int FreelancerId { get; set; }
    public string FreelancerName { get; set; }
    public decimal Amount { get; set; }
} 