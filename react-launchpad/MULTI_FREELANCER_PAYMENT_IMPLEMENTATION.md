# 🎯 Multi-Freelancer Payment Implementation Guide

## ✅ **What We've Implemented**

### **Frontend Changes:**
1. **Updated `MultiFreelancerPaymentModal.tsx`:**
   - Removed sequential payment flow
   - Now creates single Stripe session for all freelancers
   - Simplified payment process

2. **Added `createMultiFreelancerCheckoutSession` API:**
   - New endpoint in `apiendpoints.ts`
   - Sends all freelancer payment data in one request

### **Backend Changes Needed:**

## 🔧 **1. Add New DTO Classes**

Create these classes in your DTOs folder:

```csharp
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
```

## 🔧 **2. Add New Function to PaymentFunctions.cs**

Add this function to your existing `PaymentFunctions` class:

```csharp
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
```

## 🔧 **3. Update Webhook Function**

Replace your existing webhook function with this updated version that handles both single and multi-freelancer payments:

```csharp
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
    StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];

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
            var sessionJson = JsonConvert.SerializeObject(stripeEvent.Data.Object);
            var checkoutSession = JsonConvert.DeserializeObject<Session>(sessionJson);

            if (checkoutSession?.Metadata != null)
            {
                // Check if this is a multi-freelancer payment
                if (checkoutSession.Metadata.ContainsKey("paymentIds"))
                {
                    // Handle multi-freelancer payment
                    var paymentIdsStr = checkoutSession.Metadata["paymentIds"];
                    logger.LogInformation($"📦 Multi-freelancer payment - paymentIds: {paymentIdsStr}");

                    var paymentIds = paymentIdsStr.Split(',', StringSplitOptions.RemoveEmptyEntries);
                    var updatedCount = 0;

                    foreach (var paymentIdStr in paymentIds)
                    {
                        if (int.TryParse(paymentIdStr.Trim(), out int paymentId))
                        {
                            var payment = await _unitOfWork.PaymentRepository.GetPaymentByIdAsync(paymentId);
                            if (payment != null)
                            {
                                payment.PaymentStatus = "Paid";
                                await _unitOfWork.PaymentRepository.UpdateAsync(payment);
                                updatedCount++;
                                logger.LogInformation($"✅ Payment #{paymentId} marked as Paid.");
                            }
                            else
                            {
                                logger.LogWarning($"⚠️ No payment found with ID: {paymentId}");
                            }
                        }
                        else
                        {
                            logger.LogWarning($"❗ Invalid payment ID: {paymentIdStr}");
                        }
                    }

                    await _unitOfWork.SaveAsync();
                    logger.LogInformation($"🎉 Successfully updated {updatedCount} payments for multi-freelancer session.");
                }
                else if (checkoutSession.Metadata.ContainsKey("paymentId"))
                {
                    // Handle single payment (existing logic)
                    var paymentIdStr = checkoutSession.Metadata["paymentId"];
                    logger.LogInformation($"📦 Single payment - paymentId: {paymentIdStr}");

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
                    logger.LogWarning("❗ Metadata missing paymentId or paymentIds");
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
```

## 🎯 **How It Works**

### **1. Frontend Flow:**
```
Client selects freelancers → Sets payment amounts → 
Single API call → One Stripe checkout page → 
One payment → All freelancers marked as "Paid"
```

### **2. Backend Flow:**
```
1. Receive multi-freelancer payment request
2. Validate total amount matches individual amounts
3. Create payment records for each freelancer
4. Create single Stripe session with line items
5. Store payment IDs in session metadata
6. Return checkout URL
```

### **3. Webhook Flow:**
```
1. Receive checkout.session.completed event
2. Check if paymentIds (multi) or paymentId (single)
3. Update all payment records to "Paid" status
4. Log success for each payment
```

## 📊 **Expected Stripe Checkout Page:**

```
┌─────────────────────────────────────┐
│ Stripe Checkout                     │
│                                     │
│ Milestone Payment - Project #123    │
│                                     │
│ Line Items:                         │
│ • John Doe: $1,000.00               │
│ • Jane Smith: $1,000.00             │
│                                     │
│ Total: $2,000.00                    │
│                                     │
│ [Pay $2,000.00]                     │
└─────────────────────────────────────┘
```

## ✅ **Benefits:**

1. **Single Payment:** User pays once for all freelancers
2. **Better UX:** No need to return to page multiple times
3. **Atomic Transaction:** All payments succeed or fail together
4. **Clear Receipt:** One Stripe receipt with all line items
5. **Simplified Webhook:** Process all payments in one webhook call

## 🚀 **Testing Steps:**

1. **Deploy backend changes**
2. **Test single freelancer payment** (should still work)
3. **Test multi-freelancer payment** (new flow)
4. **Verify webhook updates** all payment records
5. **Check frontend displays** correct payment status

## 📝 **Notes:**

- The system is **backward compatible** - single freelancer payments still work
- **Validation ensures** total amount matches sum of individual amounts
- **Metadata stores** all payment IDs for webhook processing
- **Success URL** includes all payment IDs for frontend handling 