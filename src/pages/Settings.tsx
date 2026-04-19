import { useState } from "react";
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
import {
  FileText,
  Briefcase,
  Lock,
  HelpCircle,
  CircleDollarSign,
  AlertTriangle,
  Sparkles,
  LogOut,
  Trash2,
  Check,
} from "lucide-react";

const COUNTRIES = [
  "United States","United Kingdom","Canada","Australia","Germany","France",
  "Spain","Italy","Netherlands","Sweden","Brazil","Mexico","India","Japan","Other",
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

type OptionItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };

const DOC_TYPE_OPTIONS: OptionItem[] = [
  { id: "freelance", label: "Freelance contracts", icon: FileText },
  { id: "job",       label: "Job offers",          icon: Briefcase },
  { id: "nda",       label: "NDAs",                icon: Lock },
  { id: "random",    label: "Random stuff I don't fully read", icon: HelpCircle },
];

const CONCERN_OPTIONS: OptionItem[] = [
  { id: "stuck",  label: "Getting stuck in something", icon: Lock },
  { id: "money",  label: "Losing money",               icon: CircleDollarSign },
  { id: "hidden", label: "Hidden weird terms",         icon: AlertTriangle },
  { id: "all",    label: "All of the above",           icon: Sparkles },
];

function parseLocation(location: string): { country: string; usState: string } {
  if (!location) return { country: "", usState: "" };
  if (location.endsWith(", USA")) {
    return { country: "United States", usState: location.replace(", USA", "") };
  }
  return { country: location, usState: "" };
}

function OptionCard({
  opt, active, onSelect,
}: {
  opt: OptionItem;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = opt.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border text-left transition-smooth",
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:border-muted-foreground/40 hover:bg-accent/40 hover:-translate-y-0.5"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl grid place-items-center transition-smooth shrink-0",
          active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium">{opt.label}</span>
    </button>
  );
}

const Settings = () => {
  const navigate = useNavigate();

  const rawProfile = localStorage.getItem("bys_user_profile");
  const stored = rawProfile ? JSON.parse(rawProfile) : {};
  const parsed = parseLocation(stored.location ?? "");

  const [displayName, setDisplayName] = useState<string>(stored.displayName ?? "");
  const [country, setCountry]         = useState<string>(parsed.country);
  const [usState, setUsState]         = useState<string>(parsed.usState);
  const [docType, setDocType]         = useState<string>(stored.documentType ?? "");
  const [concern, setConcern]         = useState<string>(stored.mainConcern ?? "");
  const [saved, setSaved]             = useState(false);

  const handleSave = () => {
    const location =
      country === "United States" && usState
        ? `${usState}, USA`
        : country;

    const updatedProfile = {
      ...stored,
      displayName,
      location,
      documentType: docType,
      mainConcern: concern,
    };
    localStorage.setItem("bys_user_profile", JSON.stringify(updatedProfile));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("bys_onboarding_complete");
    localStorage.removeItem("bys_user_profile");
    navigate("/login");
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "This will delete all your saved data and preferences. Are you sure?"
    );
    if (confirmed) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="p-8 max-w-2xl animate-fade-up">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Settings</h1>
      <p className="text-muted-foreground mb-10">
        Manage your profile and preferences.
      </p>

      <section className="bg-card rounded-3xl p-7 border border-border shadow-card mb-6">
        <h2 className="text-base font-semibold mb-5">Profile</h2>

        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Display name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="h-12 bg-background border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Country</label>
            <Select
              value={country}
              onValueChange={(v) => { setCountry(v); setUsState(""); }}
            >
              <SelectTrigger className="h-12 rounded-2xl bg-background border-border text-base px-5">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {country === "United States" && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium mb-2">State</label>
              <Select value={usState} onValueChange={setUsState}>
                <SelectTrigger className="h-12 rounded-2xl bg-background border-border text-base px-5">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-3">
              What do you usually sign?
            </label>
            <div className="grid gap-2">
              {DOC_TYPE_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.id}
                  opt={opt}
                  active={docType === opt.id}
                  onSelect={() => setDocType(opt.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-3xl p-7 border border-border shadow-card mb-6">
        <h2 className="text-base font-semibold mb-5">Preferences</h2>
        <label className="block text-sm font-medium mb-3">
          What are you most worried about?
        </label>
        <div className="grid gap-2">
          {CONCERN_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              opt={opt}
              active={concern === opt.id}
              onSelect={() => setConcern(opt.id)}
            />
          ))}
        </div>
      </section>

      <Button
        onClick={handleSave}
        className={cn(
          "w-full h-12 rounded-2xl font-medium text-base shadow-glow transition-smooth mb-10",
          saved
            ? "bg-success/80 text-white"
            : "bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground"
        )}
      >
        {saved ? (
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" /> Saved
          </span>
        ) : (
          "Save changes"
        )}
      </Button>

      <section className="bg-card rounded-3xl p-7 border border-destructive/30 shadow-card">
        <h2 className="text-base font-semibold mb-1">Danger zone</h2>
        <p className="text-sm text-muted-foreground mb-5">
          These actions cannot be undone.
        </p>
        <div className="grid gap-3">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 rounded-2xl border-border bg-background hover:bg-accent font-medium flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="w-full h-12 rounded-2xl border-destructive/50 bg-background hover:bg-destructive/10 text-destructive font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear all data
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
