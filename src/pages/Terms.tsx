import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: April 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          {/* What We Do */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">🤖 What beforeyousign Actually Does</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use AI to read contracts and explain them in a fun, simple way. We're <span className="font-semibold text-foreground">NOT real lawyers</span> and we <span className="font-semibold text-foreground">CAN'T give legal advice</span>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We're like a friend who reads boring contracts and tells you the bad parts. We show you what could hurt you, but you gotta make your own choices.
            </p>
          </section>

          {/* Important Disclaimer */}
          <section className="bg-danger/10 border border-danger/30 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4 text-danger">⚠️ We're Not Lawyers</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-bold text-danger">❌</span>
                <span>We cannot give legal advice</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-danger">❌</span>
                <span>We're not your lawyer</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-danger">❌</span>
                <span>Our analysis might miss stuff</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-danger">❌</span>
                <span>Always consult a real lawyer for important contracts</span>
              </li>
            </ul>
          </section>

          {/* What We Do Provide */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">✅ What We Actually Help With</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>Breaking down confusing contract language</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>Spotting common red flags (auto-renewal, vague payment terms, etc.)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>Explaining what specific clauses mean</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>Helping you ask smarter questions before signing</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>Making legal jargon fun and easy to understand</span>
              </li>
            </ul>
          </section>

          {/* Your Responsibility */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">📋 Your Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By using beforeyousign, you agree that:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>You understand we're NOT a law firm</li>
              <li>You'll get professional legal advice for anything serious</li>
              <li>You're responsible for your own decisions</li>
              <li>We're not liable for losses from our analysis</li>
              <li>You'll read the actual contract yourself</li>
            </ul>
          </section>

          {/* How It Works */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">🔍 How Our Analysis Works</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use AI to:
            </p>
            <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
              <li>Read your contract (PDF, DOCX, or text)</li>
              <li>Look for common problem areas</li>
              <li>Give it a risk score (0-100)</li>
              <li>Explain it plainly, no legal jargon</li>
              <li>Highlight the stuff that could bite you</li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Our AI is smart, but not perfect. It might miss things, or flag stuff that's actually fine. Always double-check with a real lawyer.
            </p>
          </section>

          {/* Data Privacy */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">🔐 Your Contract Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              We store your contracts so you can see them later on your dashboard. We don't sell your data, share it with lawyers, or use it for anything except analyzing it for you.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">📝 Changes</h2>
            <p className="text-muted-foreground leading-relaxed">
              We might update these terms. If we do something major, we'll let you know. Keep using the app = you agree to the new terms.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">💬 Questions?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Email us at <span className="font-semibold text-foreground">aroozka@gmail.com</span> if you have questions about these terms.
            </p>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <Button
            onClick={() => navigate("/login")}
            size="lg"
            className="h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium shadow-glow transition-smooth"
          >
            Back to Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Terms;
