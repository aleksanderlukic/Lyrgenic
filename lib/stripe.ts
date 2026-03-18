// lib/stripe.ts – Stripe client + helpers
import Stripe from "stripe";

// Lazy singleton – instantiated on first use so build-time module evaluation
// doesn't throw when STRIPE_SECRET_KEY is absent from the build environment.
let _stripe: Stripe | undefined;

function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  _stripe = new Stripe(key, {
    apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return _stripe;
}

// Proxy keeps the existing `stripe.*` call-sites unchanged while deferring
// instantiation until the first property access (always at request-time).
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripeClient(), prop, receiver);
  },
});

export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    limit: Number(process.env.FREE_GENERATIONS_PER_DAY ?? 5),
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    limit: Infinity,
  },
  creator: {
    name: "Creator",
    priceId: process.env.STRIPE_PRICE_CREATOR ?? "",
    limit: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
