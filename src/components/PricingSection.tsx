import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    tagline: "for the occasional lease or job offer",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "3 documents a month",
      "Red flags read out loud",
      "Ask follow-up questions",
      "Pick your orb color",
    ],
  },
  {
    name: "Pro",
    tagline: "for freelancers, renters, and anyone signing a lot",
    monthly: 7,
    yearly: 5,
    cta: "Go Pro",
    featured: true,
    features: [
      "Unlimited documents",
      "Long docs, up to 100 pages",
      "Full history, replay any doc",
      "Everything in Free",
      "Early access to new voices",
    ],
  },
];

export const PricingSection = () => {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="px-4 md:px-6 py-16 md:py-24 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 md:mb-5">
            💸 Pricing
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
            Cheaper than <span className="font-serif italic text-primary">one bad contract</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">Start free. Upgrade if you sign stuff a lot.</p>

          <div
            role="radiogroup"
            aria-label="Billing period"
            className="inline-flex items-center gap-1 mt-7 p-1 rounded-full border border-border bg-card"
          >
            {[
              { label: "Monthly", value: false },
              { label: "Yearly", value: true },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={yearly === o.value}
                onClick={() => setYearly(o.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  yearly === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {o.label}
                {o.value && <span className="ml-1.5 text-[11px] opacity-80">-28%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {PLANS.map((plan) => {
            const price = yearly ? plan.yearly : plan.monthly;
            return (
              <div key={plan.name} className={cn("bezel", plan.featured && "ring-1 ring-primary/40")}>
                <div className="bezel-inner relative h-full p-6 md:p-8 flex flex-col">
                  {plan.featured && (
                    <span className="absolute top-5 right-5 font-hand text-xl text-primary rotate-3">most picked</span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>

                  <div className="flex items-baseline gap-1.5 mt-6 mb-1">
                    <span className="text-5xl font-semibold tracking-tight tabular-nums">${price}</span>
                    <span className="text-muted-foreground text-sm">{price ? "/ month" : "forever"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground h-4">
                    {price && yearly ? `billed $${plan.yearly * 12} a year` : ""}
                  </p>

                  <ul className="space-y-2.5 my-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[15px]">
                        <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link to="/login">
                    <Button
                      size="lg"
                      variant={plan.featured ? "default" : "secondary"}
                      className={cn("w-full h-12 rounded-2xl font-medium", plan.featured && "shadow-glow")}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">Cancel anytime. No hidden fees, we'd literally flag ourselves.</p>
      </div>
    </section>
  );
};
