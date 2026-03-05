// lib/stripe.ts – Stripe client + helpers
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // Use latest API version — update when Stripe releases a newer one
  apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
  typescript: true,
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
