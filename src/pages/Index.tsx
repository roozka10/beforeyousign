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
import { AlertTriangle, Sparkles, ArrowRight, Volume2 } from "lucide-react";
import { TalkingOrb } from "@/components/TalkingOrb";
import { ColorPicker } from "@/components/ColorPicker";
import { useSpeaker } from "@/hooks/use-voice";
import { preloadHumanVoice, unlockAudio } from "@/lib/human-voice";
import { AdUnit } from "@/components/monetization/AdUnit";
import { AffiliatePartners } from "@/components/monetization/AffiliatePartners";

const sections = [
  { id: "problem", label: "Problem" },
  { id: "how-companies", label: "How they get you" },
  { id: "how-it-works", label: "How it works" },
  { id: "faq", label: "FAQ" },
];

// Sample comments for the landing-page feed (illustrative, not real users' docs)
const SAMPLE_COMMENTS = [
  { doc: "apartment lease", flag: "🚩", text: "they can keep your deposit for \"normal wear and tear\". that's literally just living there 💀" },
  { doc: "job offer", flag: "👀", text: "\"other duties as assigned\" means they can basically make you do anything" },
  { doc: "gym membership", flag: "🚩", text: "auto-renews every year and you can only cancel by mailing a letter. who even does that" },
  { doc: "freelance contract", flag: "🚩", text: "they'd own everything you make, even stuff from before the gig. push back on this one" },
  { doc: "NDA", flag: "👀", text: "this NDA never ends. like ever. ask for 2 years instead" },
  { doc: "app's terms", flag: "👀", text: "you can't take them to court, only private arbitration. way harder to win that way" },
  { doc: "phone plan", flag: "🤏", text: "there's a $4.99 \"admin fee\" every month that wasn't in the ad. small but annoying" },
  { doc: "internship offer", flag: "🚩", text: "unpaid, 40 hours a week, and a non-compete?? ngl I'd pass" },
];

const STEPS = [
  {
    title: "Drop any doc",
    body: "Lease, job offer, NDA, terms, bills. PDF, Word, text — throw it on the orb.",
  },
  {
    title: "It finds only the problems",
    body: "No 10-page summary. Just the stuff that could cost you money, freedom, or sleep.",
  },
  {
    title: "It tells you out loud",
    body: "The orb says every red flag like a TikTok comment — then you ask it anything about your doc.",
  },
];

const DEMO_LINES = [
  "hey, I'm the orb.",
  "send me any document and I'll tell you what's sketchy in it. just the stuff that matters.",
  "then you can ask me whatever you want about it."
];

const Index = () => {
  const navigate = useNavigate();
  const speaker = useSpeaker();

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
        <nav className="flex items-center justify-between gap-2 sm:gap-4 px-3 py-2 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-elevated">
          <Link to="/" className="flex items-center gap-2 pl-1 sm:pl-2 min-w-0">
            <img src="/logo.png" alt="beforeyousign" className="w-7 h-7 object-contain shrink-0" />
            <span className="font-semibold tracking-tight truncate">beforeyousign</span>
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
      <section className="relative overflow-hidden pt-28 md:pt-40 pb-16 md:pb-24 px-4 md:px-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[500px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          <div className="flex justify-center mb-4 md:mb-5">
            <a
              href="https://www.producthunt.com/products/beforeyousign-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-beforeyousign-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="Beforeyousign - Discover what could screw you in a contract | Product Hunt"
                width="200"
                height="43"
                className="md:w-[250px] md:h-[54px]"
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1132790&theme=dark&t=1777211057379"
              />
            </a>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 text-xs text-muted-foreground mb-5 md:mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Drop any doc. Hear the red flags.
          </div>
          <h1 className="text-4xl md:text-7xl font-semibold tracking-tight mb-5 md:mb-6 leading-[1.08] md:leading-[1.05]">
            Find what could{" "}
            <span className="font-serif italic text-primary">screw you</span>{" "}
            in the fine print
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10">
            A talking orange orb reads the fine print, says <span className="marker">only the problems</span>{" "}
            out loud in plain Gen Z English, then answers your questions.
          </p>
          <Link to="/login">
            <Button
              size="lg"
              className="h-12 md:h-14 px-6 md:px-8 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth"
            >
              Get started — it's free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Free · no card · works with PDF, Word, and text
          </p>
        </div>

        {/* Orb + live comment feed */}
        <div className="max-w-5xl mx-auto mt-12 md:mt-20 animate-fade-up">
          <div className="bezel">
            <div className="bezel-inner grid md:grid-cols-[1fr_1.2fr] gap-8 md:gap-4 p-6 md:p-10 items-center overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (speaker.speaking || speaker.warming) return speaker.stop();
                    unlockAudio();
                    preloadHumanVoice();
                    speaker.speak(DEMO_LINES, { waitForHumanMs: 20000 });
                  }}
                  aria-label="Hear the orb talk"
                  className="rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                >
                  <TalkingOrb state={speaker.warming ? "thinking" : speaker.speaking ? "talking" : "idle"} energyRef={speaker.energyRef} size={180} />
                </button>
                <p className="font-hand text-2xl text-primary mt-6 -rotate-2">hi, I read the fine print 👋</p>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  {speaker.warming
                    ? `warming up my voice${speaker.voiceStatus === "loading" ? ` ${Math.round(speaker.voiceProgress * 100)}%` : ""}…`
                    : "tap me — I talk, free in your browser"}
                </p>
                <ColorPicker className="mt-4" />
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 mb-2 text-xs text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                    <span className="relative w-2 h-2 rounded-full bg-primary" />
                  </span>
                  example red flags
                </div>
              <div className="relative h-[320px] overflow-hidden [mask-image:linear-gradient(transparent,#000_10%,#000_90%,transparent)]">
                <ul className="animate-feed space-y-3 pt-4">
                  {[...SAMPLE_COMMENTS, ...SAMPLE_COMMENTS].map((c, i) => (
                    <li key={i} aria-hidden={i >= SAMPLE_COMMENTS.length} className="flex gap-3 rounded-2xl bg-background/50 border border-border p-3.5 text-left">
                      <div className="w-8 h-8 shrink-0 rounded-full orb-body" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          <span className="font-semibold text-foreground">beforeyousign</span> · on {/^[aeiou]/i.test(c.doc) ? "an" : "a"} {c.doc}
                        </p>
                        <p className="text-sm leading-relaxed">
                          {c.flag} {c.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8">
        <div className="max-w-5xl mx-auto">
          <AdUnit />
        </div>
      </section>

      {/* Section 2 — Problem */}
      <section id="problem" className="px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium mb-4 md:mb-5">
              <AlertTriangle className="w-3.5 h-3.5" /> The problem
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 md:mb-5">
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
      <section id="how-companies" className="px-4 md:px-6 py-16 md:py-24 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-medium mb-4 md:mb-5">
              💀 How they get you
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 md:mb-5">
              Some contracts are{" "}
              <span className="font-serif italic">confusing on purpose</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
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
      <section id="how-it-works" className="px-4 md:px-6 py-16 md:py-24 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 md:mb-5">
              🧠 How it works
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 md:mb-5">
              So we read it <span className="font-serif italic text-primary">and say it</span> for you
            </h2>
          </div>

          <div className="bezel">
            <div className="bezel-inner grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {STEPS.map((step, i) => (
                <div key={step.title} className="p-6 md:p-8">
                  <p className="text-lg font-semibold mb-2">
                    <span className="text-primary">{i + 1}.</span> {step.title}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
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

      <section className="px-4 md:px-6 py-8 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <AdUnit format="horizontal" />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 md:px-6 py-16 md:py-24 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground mb-4 md:mb-5">
              FAQ
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
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
                a: "Pretty much anything with text. Leases, job offers, freelance contracts, NDAs, app terms, bills — PDF, Word, TXT, RTF, HTML, Markdown.",
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
                q: "Does the voice cost money?",
                a: "Nope. The orb uses the voice built into your browser, so it's free. Works best in Chrome, Safari, and Edge.",
              },
              {
                q: "Can I ask it questions?",
                a: "Yep — type or tap the mic. It only answers stuff about your doc, so it stays on topic and doesn't make things up.",
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

      <section className="px-4 md:px-6 py-16 md:py-20 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <AffiliatePartners />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 md:px-6 py-16 md:py-24 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 md:mb-5">
            Stop signing things you{" "}
            <span className="font-serif italic">haven't read</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-6 md:mb-8">
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
      <footer className="px-6 py-10 pb-32 md:pb-10 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="beforeyousign" className="w-6 h-6 object-contain" />
              <span className="font-semibold text-foreground">beforeyousign</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
            </div>
          </div>
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} beforeyousign. Read before you sign.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
