import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { MapPin, LogOut, Trash2 } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    const loadLocation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const cached = localStorage.getItem(`bys_user_location_${session.user.id}`);
      if (cached) { setLocation(cached); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("location")
        .eq("id", session.user.id)
        .single();

      if (profile?.location) setLocation(profile.location);
    };

    loadLocation();
  }, []);

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
        Manage your account preferences.
      </p>

      <section className="bg-card rounded-3xl p-7 border border-border shadow-card mb-6">
        <h2 className="text-base font-semibold mb-5">Your location</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 grid place-items-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-medium">
              {location ?? "Location not detected"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used to apply local laws to your contract analysis
            </p>
          </div>
        </div>
      </section>

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
