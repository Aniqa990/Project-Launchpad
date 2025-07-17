import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";

// Add import for the new API function
import { createStripePaymentIntent, createStripeCheckoutSession } from "../../apiendpoints";
// Add fetch for Stripe Checkout session

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [amount] = useState(50.75); // can be dynamic
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setMessage("");

    try {
      // 1. Call your backend to create PaymentIntent using the new API function
      const { clientSecret } = await createStripePaymentIntent({
        clientId: 1,
        freelancerId: 2,
        projectId: 3,
        paymentType: "Milestone",
        milestoneId: 4,
        timesheetId: null,
        amount: amount,
      });

      // 2. Confirm card payment on frontend
      const result = await stripe?.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements?.getElement(CardElement)!,
        },
      });

      if (result?.error) {
        setMessage("  Payment failed: " + result.error.message);
      } else if (result?.paymentIntent?.status === "succeeded") {
        setMessage("  Payment successful!");
      }
    } catch (err) {
      setMessage("Error processing payment.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for Stripe Checkout (hosted page)
  const handleStripeCheckout = async () => {
    setLoading(true);
    setMessage("");
    try {
      // Use the same payload as handlePayment, but call the new API
      const { url } = await createStripeCheckoutSession({
        clientId: 1,
        freelancerId: 2,
        projectId: 3,
        paymentType: "Milestone",
        milestoneId: 4,
        timesheetId: null,
        amount: amount,
      });
      if (url) {
        window.location.href = url;
      } else {
        setMessage('Failed to initiate Stripe Checkout.');
      }
    } catch (err) {
      setMessage('Error redirecting to Stripe Checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">Make Payment (${amount})</h2>
      <CardElement className="p-2 border rounded" />
      <button
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handlePayment}
        disabled={!stripe || loading}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
      <button
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded ml-2"
        onClick={handleStripeCheckout}
        disabled={loading}
      >
        Pay with Stripe Gateway
      </button>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
};

export default PaymentForm;
