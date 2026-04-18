import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Check } from "lucide-react";

const AVATARS = [
  "👨‍💼",
  "👩‍💼",
  "👨‍🔬",
  "👩‍💻",
  "🧑‍🎓",
  "👨‍⚖️",
  "👩‍💡",
];

const Pricing = () => {
  const navigate = useNavigate();
  const [contractCount, setContractCount] = useState(1);
  const pricePerContract = 2.99;
  const totalPrice = (contractCount * pricePerContract).toFixed(2);

  const checkOneFeatures = [
    "Full contract scan",
    "Deal score (0–100)",
    "Simple risk breakdown",
    '"What happens if you sign"',
    "Fix suggestions",
  ];

  const unlimitedFeatures = [
    "Unlimited contract scans",
    "Same full analysis (no locked features)",
    "Faster processing",
    "History of past contracts",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-20 pb-16 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          When was the last time you actually read a contract?
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Most people don't. That's how they get screwed.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Check One Card */}
          <div className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-elevated hover:shadow-elevated hover:border-muted-foreground/30 transition-smooth animate-fade-up">
            <div className="mb-8">
              <span className="text-3xl mb-4 block">⚡</span>
              <h2 className="text-3xl font-bold mb-2">Check One</h2>
              <p className="text-muted-foreground text-sm">For when you just need a quick answer</p>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-bold">${totalPrice}</span>
                <span className="text-muted-foreground">/ total</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">No subscription. Pay once.</p>
            </div>

            {/* Slider Component */}
            <div className="bg-secondary/50 rounded-2xl p-6 mb-8">
              <div className="mb-4">
                <p className="text-sm font-semibold mb-3">
                  Selected: {contractCount} contract{contractCount !== 1 ? "s" : ""}
                </p>
                <Slider
                  value={[contractCount]}
                  onValueChange={(val) => setContractCount(val[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>1 contract</span>
                <span>50+</span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {checkOneFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Subtext */}
            <p className="text-xs text-muted-foreground mb-6 p-3 rounded-lg bg-secondary/50">
              👉 Use it when something feels off
            </p>

            {/* CTA Button */}
            <Button
              onClick={() => navigate("/upload")}
              size="lg"
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth"
            >
              Check a contract
            </Button>
          </div>

          {/* Unlimited Card */}
          <div className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-elevated hover:shadow-elevated hover:border-muted-foreground/30 transition-smooth animate-fade-up"
            style={{ animationDelay: "80ms" }}>
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4">
                Most Popular
              </span>
              <span className="text-3xl mb-4 block">🔥</span>
              <h2 className="text-3xl font-bold mb-2">Unlimited</h2>
              <p className="text-muted-foreground text-sm">For people who check everything before signing</p>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-bold">$13.99</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-orange-500 font-semibold mt-3">Cancel anytime</p>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {unlimitedFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Subtext */}
            <p className="text-xs text-muted-foreground mb-6 p-3 rounded-lg bg-secondary/50">
              👉 Best for freelancers, job offers, founders
            </p>

            {/* CTA Button */}
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth"
            >
              Start free trial <span className="ml-2">→</span>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              14 days free. No card required.
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto text-center px-6">
          <div className="flex justify-center -space-x-4 mb-4">
            {AVATARS.map((avatar, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-background flex items-center justify-center text-lg"
              >
                {avatar}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground">
            Loved by <span className="font-semibold text-foreground">16,637 users</span> who stopped guessing.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Common questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I switch between plans?",
                a: "Yes, switch anytime. If you upgrade mid-month, we'll credit your existing payment.",
              },
              {
                q: "What if I'm not happy?",
                a: "Get a full refund within 30 days. No questions asked. We're confident you'll love it.",
              },
              {
                q: "Is the analysis the same on both plans?",
                a: "Yes. Pay-per-contract and Unlimited get the exact same full analysis. The difference is just how often you check.",
              },
              {
                q: "Do you really not lock features behind paywalls?",
                a: "Nope. Everything you need is included on both plans. We hate artificial limitations.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-muted-foreground text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-6 bg-secondary/30 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to stop guessing?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Check your first contract today. No card required.
          </p>
          <Button
            onClick={() => navigate("/upload")}
            size="lg"
            className="h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth px-8"
          >
            Check a contract now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
