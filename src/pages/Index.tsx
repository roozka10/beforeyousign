import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Upload,
  ScanSearch,
  FileCheck2,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const sections = [
  { id: "problem", label: "Problem" },
  { id: "how-companies", label: "How they get you" },
  { id: "how-it-works", label: "How it works" },
  { id: "what-you-get", label: "What you get" },
  { id: "faq", label: "FAQ" },
];

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("bys_user_id");
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Floating nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl">
        <nav className="flex items-center justify-between gap-4 px-3 py-2 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-elevated">
          <Link to="/" className="flex items-center gap-2 pl-2">
            <img src="/logo.png" alt="beforeyousign" className="w-7 h-7 object-contain" />
            <span className="font-semibold tracking-tight">beforeyousign</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-smooth"
              >
                {s.label}
              </a>
            ))}
          </div>
          <Link to="/login">
            <Button
              size="sm"
              className="rounded-xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground shadow-glow transition-smooth"
            >
              Get started
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-40 pb-24 px-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          <div className="flex justify-center mb-5">
            <a
              href="https://www.producthunt.com/products/beforeyousign-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-beforeyousign-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="Beforeyousign - Discover what could screw you in a contract | Product Hunt"
                width="250"
                height="54"
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1132790&theme=dark&t=1777211057379"
              />
            </a>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Risk-first contract analysis
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 leading-[1.05]">
            Discover what could{" "}
            <span className="font-serif italic text-primary">screw you</span>{" "}
            in a contract
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            So you can avoid costly mistakes, fast. No legal jargon — just the
            stuff that actually matters.
          </p>
          <Link to="/login">
            <Button
              size="lg"
              className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth"
            >
              Get started — it's free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            No card. Drop a contract, get the truth in seconds.
          </p>
        </div>

        {/* Demo video */}
        <div className="max-w-5xl mx-auto mt-16 animate-fade-up">
          <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-elevated">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
            <video
              src="/beforeyousigndemo.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto block"
            />
          </div>
        </div>
      </section>

      {/* Section 2 — Problem */}
      <section id="problem" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium mb-5">
              <AlertTriangle className="w-3.5 h-3.5" /> The problem
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5">
              Nobody actually reads contracts
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              You open it. Scroll a bit. See big words. Close it. Sign anyway.
              We all do it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Auto-renews without telling you",
              "You can't cancel when you want",
              "Hidden fees chilling in paragraph 17",
              "They can change things whenever they feel like it",
            ].map((t) => (
              <div
                key={t}
                className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card hover:bg-card/80 transition-smooth"
              >
                <div className="w-8 h-8 rounded-lg bg-danger/10 grid place-items-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-danger" />
                </div>
                <p className="text-base font-medium pt-1">{t}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-muted-foreground italic mt-10">
            Yeah… it was all in the contract.
          </p>
        </div>
      </section>

      {/* Section 3 — How companies get you */}
      <section id="how-companies" className="px-6 py-24 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-medium mb-5">
              💀 How they get you
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5">
              Some contracts are{" "}
              <span className="font-serif italic">confusing on purpose</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Not all of them… but enough to matter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Important stuff gets buried",
                body: "The thing that costs you money? Page 14, section 8.2.",
              },
              {
                title: "Simple things, complicated language",
                body: "Why say \"cancel\" when you can write a 4-line sentence?",
              },
              {
                title: "Exit rules are hidden",
                body: "Cancellation windows tucked where you'll never look.",
              },
              {
                title: "You agree without noticing",
                body: "Auto-renewal, arbitration, fee changes — all in there.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="p-6 rounded-2xl border border-border bg-card hover:bg-card/80 transition-smooth"
              >
                <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {c.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl border border-border bg-card text-center">
            <p className="text-lg">
              They don't need to trick you.{" "}
              <span className="text-muted-foreground">
                They just need you to not read.
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-2 italic">
              And let's be real… you weren't reading all 12 pages anyway.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — How it works */}
      <section id="how-it-works" className="px-6 py-24 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
              🧠 How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5">
              So we read it for you
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Upload,
                step: "01",
                title: "Drop your contract",
                body: "PDF, DOCX, whatever you've got.",
              },
              {
                icon: ScanSearch,
                step: "02",
                title: "We scan it",
                body: "Looking for weird, risky, or unfair stuff.",
              },
              {
                icon: FileCheck2,
                step: "03",
                title: "You get the truth",
                body: "No legal talk. Just a simple explanation.",
              },
            ].map(({ icon: Icon, step, title, body }) => (
              <div
                key={step}
                className="relative p-6 rounded-2xl border border-border bg-card hover:bg-card/80 transition-smooth"
              >
                <span className="absolute top-5 right-5 text-xs font-mono text-muted-foreground">
                  {step}
                </span>
                <div className="w-11 h-11 rounded-xl bg-primary/10 grid place-items-center mb-5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/login">
              <Button
                size="lg"
                className="h-12 px-7 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium shadow-glow transition-smooth"
              >
                Try it now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5 — What you get */}
      <section id="what-you-get" className="px-6 py-24 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-5">
              📊 What you get
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5">
              Here's what we actually show you
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No fluff. Just the stuff that matters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Gauge,
                title: "A score",
                body: "So you instantly know if it's fine or kinda sketchy.",
                tone: "primary",
              },
              {
                icon: AlertTriangle,
                title: "The risky parts",
                body: "Stuff that could lock you in, cost you money, or cause problems later.",
                tone: "danger",
              },
              {
                icon: CheckCircle2,
                title: "What's actually okay",
                body: "Not everything is bad — we'll tell you what's normal too.",
                tone: "success",
              },
              {
                icon: Sparkles,
                title: "A simple explanation",
                body: "What this contract really means in plain English.",
                tone: "warning",
              },
            ].map(({ icon: Icon, title, body, tone }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-border bg-card hover:bg-card/80 transition-smooth"
              >
                <div
                  className={`w-11 h-11 rounded-xl grid place-items-center mb-5 ${
                    tone === "primary"
                      ? "bg-primary/10 text-primary"
                      : tone === "danger"
                      ? "bg-danger/10 text-danger"
                      : tone === "success"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground mb-5">
              FAQ
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Quick answers
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: "Do I really need this?",
                a: "If you've ever signed something without reading it… yeah, probably.",
              },
              {
                q: "Is this a lawyer?",
                a: "No. Lawyers are expensive. We just help you understand what's going on before you talk to one.",
              },
              {
                q: "Can this be wrong?",
                a: "Sometimes, yeah. We're smart, not perfect. If it's a big deal, double check with a real human.",
              },
              {
                q: "Is my contract safe here?",
                a: "Yes. We don't sell your data. Your contract isn't getting passed around some secret group chat.",
              },
              {
                q: "What kind of contracts work?",
                a: "Pretty much anything with text. Job offers, freelance contracts, NDAs, random PDFs someone emailed you…",
              },
              {
                q: "What if my contract is super long?",
                a: "That's exactly when this helps most. The longer it is, the more stuff can hide inside it.",
              },
              {
                q: "Do I need to understand legal stuff to use this?",
                a: "Nope. That's the whole point. We translate everything into normal human language.",
              },
              {
                q: "How fast is it?",
                a: "Usually a few seconds. Way faster than pretending you're going to read 10 pages.",
              },
              {
                q: "Why does this even exist?",
                a: "Because too many people sign things they don't understand… and regret it later.",
              },
            ].map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border rounded-2xl bg-card px-5 data-[state=open]:bg-card/80"
              >
                <AccordionTrigger className="text-left hover:no-underline font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5">
            Stop signing things you{" "}
            <span className="font-serif italic">haven't read</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Drop your contract. Get the truth in seconds.
          </p>
          <Link to="/login">
            <Button
              size="lg"
              className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth"
            >
              Get started — it's free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="beforeyousign" className="w-6 h-6 object-contain" />
            <span className="font-semibold text-foreground">beforeyousign</span>
          </div>
          <p>© {new Date().getFullYear()} beforeyousign. Read before you sign.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
