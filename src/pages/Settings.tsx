import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LogOut, Trash2, Check } from "lucide-react";

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

function parseLocation(location: string): { country: string; usState: string } {
  if (!location) return { country: "", usState: "" };
  if (location.endsWith(", USA")) {
    return { country: "United States", usState: location.replace(", USA", "") };
  }
  return { country: location, usState: "" };
}

const Settings = () => {
  const navigate = useNavigate();

  const rawProfile = localStorage.getItem("bys_user_profile");
  const stored = rawProfile ? JSON.parse(rawProfile) : {};
  const parsed = parseLocation(stored.location ?? "");

  const [country, setCountry] = useState<string>(parsed.country);
  const [usState, setUsState] = useState<string>(parsed.usState);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    const location =
      country === "United States" && usState
        ? `${usState}, USA`
        : country;

    const updatedProfile = {
      ...stored,
      location,
    };
    localStorage.setItem("bys_user_profile", JSON.stringify(updatedProfile));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      "This will delete all your saved data and preferences. Are you sure?"
    );
    if (confirmed) {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate("/", { replace: true });
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
        </div>
      </section>

      <Button
        onClick={handleSave}
        disabled={saving}
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
        ) : saving ? (
          "Saving..."
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
