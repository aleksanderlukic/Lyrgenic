// app/api/stripe/webhook/route.ts – Stripe webhook handler
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const raw = await req.arrayBuffer();
  const body = Buffer.from(raw);
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan as "pro" | "creator" | undefined;
      const userId = session.metadata?.userId;
      if (userId && plan) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeSubId: session.subscription as string,
          },
        });
      }
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findFirst({
        where: { stripeSubId: sub.id },
      });
      if (user) {
        const active = sub.status === "active" || sub.status === "trialing";
        if (event.type === "customer.subscription.deleted" || !active) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: "free" },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
