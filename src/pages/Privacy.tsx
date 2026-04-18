import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
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
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: April 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          {/* Simple Explanation */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">🤝 The Simple Version</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect your contracts to analyze them. We don't sell your data, spam you, or share it with sketchy third parties. That's it.
            </p>
          </section>

          {/* What We Collect */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">📊 What We Collect</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <div>
                  <span className="font-semibold text-foreground">Your contracts</span> - PDF, DOCX, or text files you upload
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <div>
                  <span className="font-semibold text-foreground">Our analysis</span> - The risk scores, explanations, and comments we generate
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <div>
                  <span className="font-semibold text-foreground">Your onboarding info</span> - Location, document type, concerns (helps us give better analysis)
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <div>
                  <span className="font-semibold text-foreground">Basic usage data</span> - How many contracts you upload, when you use the app
                </div>
              </li>
            </ul>
          </section>

          {/* What We DON'T Do */}
          <section className="bg-success/10 border border-success/30 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4 text-success">✅ What We Don't Do</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>We DON'T sell your data</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>We DON'T share contracts with lawyers or third parties</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>We DON'T use your contracts for training AI (just analyzing yours)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>We DON'T spam you with marketing</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-success">✓</span>
                <span>We DON'T track you across the internet</span>
              </li>
            </ul>
          </section>

          {/* How We Use It */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">🎯 How We Use Your Data</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-2">To analyze your contracts</p>
                <p>We read your contract and run it through our AI lawyer to give you scores and explanations.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">To show them back to you</p>
                <p>We store them on your dashboard so you can view, compare, and export them anytime.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">To improve our service</p>
                <p>We look at (anonymized) trends to see what kinds of contracts people use, so we can make beforeyousign better.</p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">🔒 Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your data is stored on Supabase (secure cloud database). All communication is encrypted (HTTPS). We don't keep passwords — you sign in with Google.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              That said, no system is 100% secure. If you have sensitive contracts, encrypt them first before uploading.
            </p>
          </section>

          {/* Your Rights */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">⚖️ Your Rights</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <span><span className="font-semibold text-foreground">See your data:</span> We show you everything we have on you</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <span><span className="font-semibold text-foreground">Delete your data:</span> We'll delete your contracts and analysis anytime</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <span><span className="font-semibold text-foreground">Export your data:</span> You can download all your contracts and analyses</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <span><span className="font-semibold text-foreground">Stop using us:</span> Delete your account anytime, no questions asked</span>
              </li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">🍪 Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use basic cookies to keep you logged in and remember your preferences. We don't use tracking cookies or sell cookie data to advertisers.
            </p>
          </section>

          {/* Third Parties */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">🔗 Third Parties</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li><span className="font-semibold text-foreground">Supabase</span> - Database storage</li>
              <li><span className="font-semibold text-foreground">OpenRouter</span> - AI analysis (they don't store your contracts)</li>
              <li><span className="font-semibold text-foreground">Vercel</span> - App hosting</li>
              <li><span className="font-semibold text-foreground">Google</span> - Sign-in only</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              None of these services can see your contracts except OpenRouter (just to analyze them), and they don't store or use them.
            </p>
          </section>

          {/* Changes */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">📝 Changes to Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              If we make big changes, we'll email you and show a notification in the app. Small changes (typos, clarifications) we'll just update here.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">💬 Questions?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Email us at <span className="font-semibold text-foreground">aroozka@gmail.com</span> with privacy questions. We promise to answer within 48 hours.
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

export default Privacy;
