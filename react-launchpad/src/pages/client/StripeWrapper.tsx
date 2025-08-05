// components/StripeWrapper.tsx
import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Your publishable key from Stripe dashboard
// TODO: Replace with your real Stripe publishable key from https://dashboard.stripe.com/apikeys
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripeWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Elements stripe={stripePromise}>{children}</Elements>;
};

export default StripeWrapper; 