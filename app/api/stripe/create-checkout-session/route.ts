// app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { z } from "zod";

const Schema = z.object({ plan: z.enum(["pro", "creator"]) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { plan } = Schema.parse(body);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const priceId = PLANS[plan as PlanKey].priceId;
  if (!priceId)
    return NextResponse.json(
      { error: "Stripe price ID not configured" },
      { status: 500 },
    );

  // Create or reuse Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? "",
      name: user.name ?? "",
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { userId: user.id, plan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
