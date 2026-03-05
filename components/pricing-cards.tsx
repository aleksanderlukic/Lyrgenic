"use client";
// components/pricing-cards.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Lyrgenic at no cost.",
    badge: null,
    features: [
      "5 lyric generations per day",
      "Upload audio file",
      "Full lyrics with timestamps",
      "Export as .txt",
      "1 project",
    ],
    cta: "Get started free",
    href: "/auth/sign-up",
    variant: "outline" as const,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/ month",
    description: "For active songwriters and producers.",
    badge: "Most popular",
    features: [
      "Unlimited generations",
      "Unlimited projects",
      "Section regeneration",
      "Version history (up to 50)",
      "Export .txt, .docx, JSON",
      "Priority generation",
    ],
    cta: "Start Pro",
    href: null, // triggers Stripe checkout
    plan: "pro",
    variant: "default" as const,
  },
  {
    id: "creator",
    name: "Creator",
    price: "$29",
    period: "/ month",
    description: "Everything in Pro plus AI voice preview.",
    badge: null,
    features: [
      "Everything in Pro",
      "AI robot voice preview",
      "Mix preview on beat",
      "Unlimited version history",
      "API access (coming soon)",
    ],
    cta: "Start Creator",
    href: null,
    plan: "creator",
    variant: "default" as const,
  },
];

export function PricingCards({ freeMode = false }: { freeMode?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (res.status === 401) window.location.href = "/auth/sign-in";
      else alert(data.error ?? "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (freeMode) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-purple-500/50 glow-purple text-center">
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>Everything you need, always free.</CardDescription>
            <div className="flex items-end justify-center gap-1 mt-2">
              <span className="text-5xl font-extrabold text-foreground">
                $0
              </span>
              <span className="text-muted-foreground mb-1 text-sm">
                / forever
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-left">
              {[
                "Unlimited lyric generations",
                "Unlimited projects",
                "Audio file upload",
                "Lyrics with timestamps",
                "Section regeneration",
                "Version history",
                "Export as .txt",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-foreground/80"
                >
                  <CheckCircle2 className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/auth/sign-up" className="w-full">
              <Button className="w-full">Get started free</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative flex flex-col",
            plan.badge && "border-purple-500/50 glow-purple",
          )}
        >
          {plan.badge && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="shadow-lg">{plan.badge}</Badge>
            </div>
          )}
          <CardHeader className="pt-8">
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="flex items-end gap-1 mt-2">
              <span className="text-4xl font-extrabold text-foreground">
                {plan.price}
              </span>
              <span className="text-muted-foreground mb-1 text-sm">
                {plan.period}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-foreground/80"
                >
                  <CheckCircle2 className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {plan.href ? (
              <Link href={plan.href} className="w-full">
                <Button variant={plan.variant} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            ) : (
              <Button
                variant={plan.variant}
                className="w-full"
                loading={loading === plan.plan}
                onClick={() => plan.plan && handleCheckout(plan.plan)}
              >
                {plan.cta}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
