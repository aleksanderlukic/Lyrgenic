// app/pricing/page.tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PricingCards } from "@/components/pricing-cards";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the plan that fits your workflow.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold">
              Simple, transparent pricing
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start free. Upgrade when you need unlimited lyrics, version
              history and the AI preview voice.
            </p>
          </div>
          <PricingCards />
          <p className="text-center text-xs text-muted-foreground/50">
            All plans include unlimited project storage. Prices in USD. Cancel
            any time.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
