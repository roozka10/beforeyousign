import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, MapPin, X } from "lucide-react";
import { getContractResults, deleteContractResult, StoredContractResult, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const LocationPopup = ({ onDone }: { onDone: (location: string | null) => void }) => {
  const [loading, setLoading] = useState(false);

  const handleAllow = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const location =
            data.address?.state && data.address?.country_code === "us"
              ? `${data.address.state}, USA`
              : data.address?.country || "Unknown";
          onDone(location);
        } catch {
          onDone(null);
        }
      },
      () => {
        setLoading(false);
        onDone(null);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-elevated animate-fade-up text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-5">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Allow location access</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-7">
          We use your location to show you laws and rules that apply to your contracts. We never store your exact coordinates.
        </p>
        <Button
          onClick={handleAllow}
          disabled={loading}
          className="w-full h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-glow mb-3"
        >
          {loading ? "Detecting location..." : "Allow location"}
        </Button>
        <button
          onClick={() => onDone(null)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<StoredContractResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);

  useEffect(() => {
    loadResults();
    checkLocationPromptStatus();
  }, []);

  const checkLocationPromptStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const locationKey = `bys_user_location_${userId}`;
    const promptSeenKey = `bys_location_prompt_seen_${userId}`;

    const hasLocalLocation = localStorage.getItem(locationKey);
    const hasSeenPrompt = localStorage.getItem(promptSeenKey) === "true";

    if (hasLocalLocation || hasSeenPrompt) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("location")
      .eq("id", userId)
      .single();

    if (profile?.location) {
      localStorage.setItem(locationKey, profile.location);
      return;
    }

    setShowLocationPopup(true);
  };

  const handleLocationDone = async (location: string | null) => {
    setShowLocationPopup(false);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const locationKey = `bys_user_location_${session.user.id}`;
    const promptSeenKey = `bys_location_prompt_seen_${session.user.id}`;
    localStorage.setItem(promptSeenKey, "true");

    if (!location) return;

    localStorage.setItem(locationKey, location);

    // Save to Supabase profiles table
    if (session.user) {
      await supabase
        .from("profiles")
        .update({ location, updated_at: new Date().toISOString() })
        .eq("id", session.user.id);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContractResults();
      setResults(data);
    } catch (err) {
      console.error("Failed to load results:", err);
      setError("Failed to load your contracts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContractResult(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
      setError("Failed to delete contract. Please try again.");
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return "success";
    if (score >= 50) return "warning";
    return "danger";
  };

  const getScoreEmoji = (score: number): string => {
    if (score >= 70) return "✅";
    if (score >= 50) return "⚠️";
    return "🚨";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {showLocationPopup && <LocationPopup onDone={handleLocationDone} />}

      <div className="px-10 py-16 max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-end justify-between mb-16 gap-6 flex-wrap">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight mb-3">Your contracts</h1>
            <p className="text-muted-foreground text-lg">
              Analyzed with beforeyousign AI lawyer. Stay safe.
            </p>
          </div>
          <Button
            onClick={() => navigate("/upload")}
            size="lg"
            className="h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium px-6 shadow-glow transition-smooth"
          >
            <Upload className="w-4 h-4 mr-2" />
            Check a contract
          </Button>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-8 text-danger text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center min-h-96">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your contracts...</p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="grid place-items-center min-h-96">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-secondary grid place-items-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">No contracts yet</h2>
              <p className="text-muted-foreground mb-8">
                Upload your first contract to get started. Our AI lawyer will analyze it in seconds.
              </p>
              <Button
                onClick={() => navigate("/upload")}
                size="lg"
                className="h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium shadow-glow transition-smooth"
              >
                Upload your first contract
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result, i) => {
              const color = getScoreColor(result.overallScore);
              return (
                <div
                  key={result.id}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="group text-left bg-card rounded-3xl p-7 border border-border shadow-card hover:shadow-elevated hover:-translate-y-1 hover:border-muted-foreground/30 transition-smooth animate-fade-up relative"
                >
                  <button
                    onClick={() => handleDelete(result.id)}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/10 hover:border-danger/30 hover:text-danger"
                    title="Delete contract"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate(`/result/${result.id}`)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between mb-8 pr-8">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {formatDate(result.createdAt)}
                        </p>
                        <h3 className="text-xl font-semibold truncate">{result.fileName}</h3>
                        {result.documentType && (
                          <p className="text-xs text-muted-foreground mt-1 capitalize">
                            {result.documentType.replace("_", " ")}
                          </p>
                        )}
                      </div>
                      <span className="text-2xl flex-shrink-0">{getScoreEmoji(result.overallScore)}</span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-5">
                      <span
                        className={cn(
                          "text-6xl font-semibold tracking-tight tabular-nums",
                          color === "success" && "text-success",
                          color === "warning" && "text-warning",
                          color === "danger" && "text-danger"
                        )}
                      >
                        {result.overallScore}
                      </span>
                      <span className="text-muted-foreground text-sm">/ 100</span>
                    </div>

                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden mb-5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-smooth",
                          color === "success" && "bg-success",
                          color === "warning" && "bg-warning",
                          color === "danger" && "bg-danger"
                        )}
                        style={{ width: `${result.overallScore}%` }}
                      />
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {result.simpleExplanation}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
