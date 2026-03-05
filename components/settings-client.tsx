"use client";
// components/settings-client.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Star, Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const PLAN_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  free: {
    label: "Free",
    color: "bg-muted text-foreground",
    icon: <Zap className="h-4 w-4" />,
  },
  pro: {
    label: "Pro",
    color: "bg-purple-600 text-white",
    icon: <Crown className="h-4 w-4" />,
  },
  creator: {
    label: "Creator",
    color: "bg-yellow-500 text-black",
    icon: <Star className="h-4 w-4" />,
  },
};

interface Props {
  user: {
    id: string;
    name?: string | null;
    email: string;
    plan: string;
    stripeSubId?: string | null;
    createdAt: unknown;
  };
}

export function SettingsClient({ user }: Props) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const planMeta = PLAN_META[user.plan] ?? PLAN_META.free;

  const handleUpgrade = async (plan: "pro" | "creator") => {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {user.name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="text-foreground">{user.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground">{user.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Plan</span>
            <Badge className={`flex items-center gap-1 ${planMeta.color}`}>
              {planMeta.icon}
              {planMeta.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      {user.plan === "free" && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Unlock more generations and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Pro — $12/month</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unlimited generations + section regeneration
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgrade("pro")}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "pro" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Upgrade"
                )}
              </Button>
            </div>
            <div className="rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Creator — $29/month
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pro + voice preview + priority generation
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleUpgrade("creator")}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "creator" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Upgrade"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user.stripeSubId && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Subscription ID:{" "}
              <code className="text-foreground/70">{user.stripeSubId}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              To cancel or manage your subscription, visit your{" "}
              <a
                href="https://billing.stripe.com/p/login/test_xxxx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                Stripe billing portal
              </a>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
