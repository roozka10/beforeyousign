import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { createCheckoutSession } from "@/lib/stripe";
import { toast } from "sonner";

const Pricing = () => {
  const [loading, setLoading] = useState<"check_one" | "unlimited" | null>(null);

  const handleCheckOne = async () => {
    try {
      setLoading("check_one");
      await createCheckoutSession("check_one", 1);
    } catch (err) {
      toast.error("Could not start checkout. Please try again.");
      setLoading(null);
    }
  };

  const handleUnlimited = async () => {
    try {
      setLoading("unlimited");
      await createCheckoutSession("unlimited", 1);
    } catch (err) {
      toast.error("Could not start checkout. Please try again.");
      setLoading(null);
    }
  };

  const starterFeatures = [
    { included: true, label: "1 contract check" },
    { included: true, label: "Full risk analysis" },
    { included: true, label: "Plain-English explanation" },
    { included: true, label: "Fix suggestions" },
    { included: false, label: "Priority processing" },
    { included: false, label: "Unlimited checks" },
  ];

  const growthFeatures = [
    { included: true, label: "Unlimited contract checks" },
    { included: true, label: "Full risk analysis" },
    { included: true, label: "Plain-English explanation" },
    { included: true, label: "Priority processing" },
    { included: true, label: "History of past checks" },
    { included: true, label: "No feature limits" },
  ];

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            Pick a plan and continue to Stripe
          </h1>
          <p className="text-muted-foreground">
            Compact pricing, no hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border/70 bg-card p-7 shadow-elevated">
            <p className="text-xs tracking-[0.16em] uppercase text-muted-foreground mb-4">
              Starter
            </p>
            <div className="mb-7 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight tabular-nums">$2.99</span>
              <span className="text-muted-foreground mb-2">/ one-time</span>
            </div>

            <div className="space-y-3 mb-7">
              {starterFeatures.map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-foreground/90" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  <span className={feature.included ? "text-foreground/90" : "text-muted-foreground"}>
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleCheckOne}
              disabled={loading === "check_one"}
              size="lg"
              className="w-full h-12 rounded-xl bg-[#E96A43] hover:bg-[#dd5f3b] text-white font-semibold"
            >
              {loading === "check_one" ? "Redirecting..." : "Check one contract ->"}
            </Button>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Pay once. No subscription.
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-7 shadow-elevated">
            <p className="text-xs tracking-[0.16em] uppercase text-muted-foreground mb-4">
              Growth
            </p>
            <div className="mb-7 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight tabular-nums">$13.99</span>
              <span className="text-muted-foreground mb-2">/ month</span>
            </div>

            <div className="space-y-3 mb-7">
              {growthFeatures.map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-foreground/90" />
                  <span className="text-foreground/90">{feature.label}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleUnlimited}
              disabled={loading === "unlimited"}
              size="lg"
              className="w-full h-12 rounded-xl bg-[#E96A43] hover:bg-[#dd5f3b] text-white font-semibold"
            >
              {loading === "unlimited" ? "Redirecting..." : "Start 14-day free trial ->"}
            </Button>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              $0.00 due today. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
