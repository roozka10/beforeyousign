import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/lib/onboarding-context";
import {
  FileText,
  Briefcase,
  Lock,
  HelpCircle,
  Repeat,
  Eye,
  Brain,
  Lock as LockIcon,
  CircleDollarSign,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Brazil",
  "Mexico",
  "India",
  "Japan",
  "Other",
];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const TOTAL_STEPS = 5;

type OptionItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };

const stepOptions: Record<number, OptionItem[]> = {
  2: [
    { id: "freelance", label: "Freelance contracts", icon: FileText },
    { id: "job", label: "Job offers", icon: Briefcase },
    { id: "nda", label: "NDAs", icon: Lock },
    { id: "random", label: "Random stuff I don't fully read", icon: HelpCircle },
  ],
  3: [
    { id: "anytime", label: "Yes, anytime with notice", icon: Eye },
    { id: "conditions", label: "Yes, but with conditions", icon: Brain },
    { id: "locked", label: "No, I'm locked in", icon: LockIcon },
    { id: "unsure-exit", label: "Not sure", icon: HelpCircle },
  ],
  4: [
    { id: "me", label: "Me", icon: Sparkles },
    { id: "other", label: "The other party", icon: AlertTriangle },
    { id: "balanced", label: "It feels balanced", icon: Repeat },
    { id: "unsure-control", label: "Not sure", icon: HelpCircle },
  ],
  5: [
    { id: "stuck", label: "Getting stuck in something", icon: LockIcon },
    { id: "money", label: "Losing money", icon: CircleDollarSign },
    { id: "hidden", label: "Hidden weird terms", icon: AlertTriangle },
    { id: "all", label: "All of the above", icon: Sparkles },
  ],
};

const stepCopy: Record<number, { title: string; subtitle?: string; question?: string }> = {
  1: {
    title: "First — where are you based?",
    subtitle: "It helps us tailor things to your local rules.",
  },
  2: {
    title: "Real quick — what kind of stuff do you usually sign?",
    subtitle: "Pick whatever sounds most like you.",
  },
  3: {
    title: "Is there an easy way to exit the contract?",
    subtitle: "Just a rough idea is fine.",
  },
  4: {
    title: "Who do you feel has more control?",
    subtitle: "Gut feeling works here.",
  },
  5: {
    title: "What are you most worried about?",
    subtitle: "We'll keep an extra eye on this.",
  },
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { saveOnboardingData } = useOnboarding();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("bys_user_id");
    if (!userId) {
      navigate("/login");
    }
  }, [navigate]);

  const [country, setCountry] = useState<string>("");
  const [usState, setUsState] = useState<string>("");
  const [picks, setPicks] = useState<Record<number, string>>({});

  const setPick = (s: number, id: string) =>
    setPicks((p) => ({ ...p, [s]: id }));

  const canContinue =
    step === 1
      ? country !== "" && (country !== "United States" || usState !== "")
      : !!picks[step];

  const next = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      try {
        const location = country === "United States" ? `${usState}, USA` : country;
        await saveOnboardingData({
          location,
          documentType: picks[2] || "",
          exitTerms: picks[3] || "",
          controlBalance: picks[4] || "",
          mainConcern: picks[5] || "",
        });
        localStorage.setItem("bys_onboarding_complete", "true");
        setDone(true);
      } catch (err) {
        console.error("Onboarding error:", err);
        navigate("/login");
      }
    }
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const copy = stepCopy[step];
  const options = stepOptions[step];

  if (done) {
    return (
      <div className="min-h-screen grid place-items-center px-6 py-16">
        <div className="w-full max-w-xl text-center animate-fade-up">
          <div className="flex items-center justify-center gap-2 mb-12">
            <img src="/penguin-removebg-preview.png" alt="beforeyousign" className="w-9 h-9 object-contain" />
            <span className="font-semibold text-lg tracking-tight">beforeyousign</span>
          </div>
          <div className="bg-card rounded-3xl p-12 border border-border shadow-elevated">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 grid place-items-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Alright. Let's make sure you don't sign something dumb.
            </h1>
            <p className="text-muted-foreground text-lg mb-10">
              Your dashboard's ready when you are.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth"
            >
              Go to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 py-10">
      <div className="w-full max-w-3xl animate-fade-up">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/penguin-removebg-preview.png" alt="beforeyousign" className="w-9 h-9 object-contain" />
          <span className="font-semibold text-lg tracking-tight">beforeyousign</span>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Step {step} of {TOTAL_STEPS}
          </p>
          <div className="h-1.5 w-full rounded-full bg-card overflow-hidden">
            <div
              className="h-full bg-primary transition-smooth rounded-full"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-card rounded-3xl shadow-elevated border-border text-center border-none py-16 px-16 md:px-20">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-3 leading-tight">
            {copy.title}
          </h1>
          {copy.subtitle && (
            <p className="text-muted-foreground text-center mb-6 text-base">
              {copy.subtitle}
            </p>
          )}

          {step === 1 ? (
            <div className="grid gap-4 max-w-md mx-auto">
              <Select value={country} onValueChange={(v) => { setCountry(v); setUsState(""); }}>
                <SelectTrigger className="h-16 rounded-2xl bg-background border-border text-base px-5">
                  <SelectValue placeholder="Pick your country" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {country === "United States" && (
                <div className="animate-fade-in">
                  <Select value={usState} onValueChange={setUsState}>
                    <SelectTrigger className="h-16 rounded-2xl bg-background border-border text-base px-5">
                      <SelectValue placeholder="Pick your state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {country === "Other" && (
                <div className="animate-fade-in">
                  <Input
                    placeholder="Type your country"
                    className="h-16 rounded-2xl bg-background border-border text-base px-5"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {options.map((opt) => {
                const Icon = opt.icon;
                const isActive = picks[step] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPick(step, opt.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border text-left transition-smooth",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-muted-foreground/40 hover:bg-accent/40 hover:-translate-y-0.5"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl grid place-items-center transition-smooth shrink-0",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button
                onClick={back}
                variant="secondary"
                size="lg"
                className="h-12 rounded-2xl bg-background hover:bg-accent border border-border font-medium px-6"
              >
                Back
              </Button>
            )}
            <Button
              onClick={next}
              disabled={!canContinue}
              size="lg"
              className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth"
            >
              {step === TOTAL_STEPS ? "Finish" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
