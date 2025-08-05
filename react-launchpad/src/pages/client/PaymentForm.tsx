import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createStripePaymentIntent, createStripeCheckoutSession } from "@/apiendpoints";

interface PaymentFormProps {
  clientId: number;
  freelancerId?: number;
  projectId: number;
  milestoneId: number;
  amount: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ clientId, freelancerId = 1, projectId, milestoneId, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { clientSecret } = await createStripePaymentIntent({
        clientId,
        freelancerId,
        projectId,
        paymentType: "Milestone",
        milestoneId,
        timesheetId: null,
        amount,
      });
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

  const handleStripeCheckout = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { url } = await createStripeCheckoutSession({
        clientId,
        freelancerId,
        projectId,
        paymentType: "Milestone",
        milestoneId,
        timesheetId: null,
        amount,
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