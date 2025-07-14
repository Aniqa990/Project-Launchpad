// components/StripeWrapper.tsx
import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Your publishable key from Stripe dashboard
// TODO: Replace with your real Stripe publishable key from https://dashboard.stripe.com/apikeys
const stripePromise = loadStripe("pk_test_51PZ65nRvejedbxrPzHbGol6cvXh1W5t7DUSo7i91Pc29mo8uc79aGGWV3a1o5epl7GreyAjdJ7JXWytSdTKaPPZG00GLt0rvI3");

const StripeWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Elements stripe={stripePromise}>{children}</Elements>;
};

export default StripeWrapper;
