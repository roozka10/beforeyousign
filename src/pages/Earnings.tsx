import { ExternalLink, DollarSign, Wallet } from "lucide-react";
import { affiliateNetworks, revenueSources } from "@/lib/affiliate-config";

const Earnings = () => {
  return (
    <div className="p-4 md:p-8 max-w-4xl animate-fade-up">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <DollarSign className="w-3.5 h-3.5" />
          Owner guide
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Where your money comes from</h1>
        <p className="text-muted-foreground max-w-2xl">
          beforeyousign is set up to earn from ads and affiliate links. Sign up for the programs below,
          then paste your tracking links into Vercel environment variables when approved.
        </p>
      </div>

      <section className="bg-card rounded-3xl border border-border p-6 md:p-8 mb-6 shadow-card">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Revenue streams on your site
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Click <strong>Sign up</strong> to join each program. Click <strong>Get paid</strong> to open the dashboard where payouts land.
        </p>

        <div className="space-y-4">
          {revenueSources.map((source) => (
            <div
              key={source.id}
              className="rounded-2xl border border-border bg-background p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{source.name}</h3>
                  <span
                    className={
                      source.status === "live"
                        ? "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/10 text-success"
                        : "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/10 text-warning"
                    }
                  >
                    {source.status === "live" ? "Live on site" : "Sign up needed"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{source.howMuch}</p>
                <p className="text-xs text-muted-foreground">Paid via {source.payoutMethods}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <a
                  href={source.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-smooth"
                >
                  Sign up
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={source.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent transition-smooth"
                >
                  Get paid
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card rounded-3xl border border-border p-6 md:p-8 mb-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">Fastest path (recommended order)</h2>
        <ol className="space-y-4 text-sm text-muted-foreground list-decimal list-inside">
          <li>
            <span className="text-foreground font-medium">Google AdSense</span> — already on the site. Open the dashboard, confirm beforeyousign.lol is approved, and turn on Auto ads.
          </li>
          <li>
            <span className="text-foreground font-medium">Sovrn Commerce</span> — one free signup auto-converts partner links (LegalZoom, Rocket Lawyer, Amazon, etc.). Add{" "}
            <code className="text-xs bg-background px-1.5 py-0.5 rounded">VITE_SOVRN_PUBLISHER_KEY</code> to Vercel after approval.
          </li>
          <li>
            <span className="text-foreground font-medium">CJ Affiliate + ShareASale</span> — apply to LegalZoom and Rocket Lawyer for higher direct commissions.
          </li>
          <li>
            <span className="text-foreground font-medium">Amazon Associates</span> — add{" "}
            <code className="text-xs bg-background px-1.5 py-0.5 rounded">VITE_AMAZON_ASSOCIATE_TAG</code> (your store ID, e.g. beforeyousign-20).
          </li>
        </ol>
      </section>

      <section className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-card">
        <h2 className="text-lg font-semibold mb-4">All affiliate networks</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {affiliateNetworks.map((network) => (
            <a
              key={network.id}
              href={network.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-border p-4 hover:border-primary/40 hover:bg-background transition-smooth"
            >
              <h3 className="font-semibold mb-1 flex items-center justify-between gap-2">
                {network.name}
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{network.notes}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Earnings;
