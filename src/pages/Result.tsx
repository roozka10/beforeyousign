import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractAnalysis } from "@/services/ai-lawyer";
import { getContractResult, StoredContractResult } from "@/lib/supabase";

const Result = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [storedResult, setStoredResult] = useState<StoredContractResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load result from Supabase
  useEffect(() => {
    if (!id) {
      setError("No contract ID provided");
      setLoading(false);
      return;
    }

    loadResult(id);
  }, [id]);

  const loadResult = async (resultId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getContractResult(resultId);

      if (!result) {
        setError("Contract not found");
        setLoading(false);
        return;
      }

      setStoredResult(result);
      setAnalysis({
        overallScore: result.overallScore,
        clarity: result.clarity,
        fairness: result.fairness,
        riskLevel: result.riskLevel,
        keyIssues: result.keyIssues,
        simpleExplanation: result.simpleExplanation,
      });
    } catch (err) {
      console.error("Failed to load result:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load contract result. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Animate score when analysis loads
  useEffect(() => {
    if (!analysis) return;

    let raf: number;
    const start = performance.now();
    const duration = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedScore(Math.round(eased * analysis.overallScore));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analysis]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "success";
      case "medium":
        return "warning";
      case "high":
        return "danger";
      default:
        return "warning";
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case "low":
        return "bg-success/10";
      case "medium":
        return "bg-warning/10";
      case "high":
        return "bg-danger/10";
      default:
        return "bg-warning/10";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading contract analysis...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">Oops!</h2>
          <p className="text-muted-foreground mb-8">{error || "No analysis available"}</p>
          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-primary hover:bg-primary/90"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => navigate("/upload")}
              variant="outline"
            >
              Upload Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fileName = storedResult?.fileName || "Contract.pdf";

  return (
    <div className="min-h-screen px-6 py-8 md:py-10">
      <div className="w-full max-w-6xl mx-auto animate-fade-up">
        {/* Top header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="beforeyousign"
              className="w-9 h-9 object-contain"
            />
            <span className="font-semibold text-lg tracking-tight">beforeyousign</span>
          </div>
          <span className="text-xs md:text-sm text-muted-foreground font-mono tracking-tight">
            {fileName}
          </span>
        </div>

        {/* Top row: score card (left) + ratings (right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Overall Score Card */}
          <div className="relative bg-card rounded-3xl border border-border p-6 overflow-hidden">
            <div className={cn("absolute -right-6 -top-6 w-40 h-40 rounded-full blur-3xl", getRiskBg(analysis.riskLevel))} />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-background border border-border grid place-items-center mb-6">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span
                  className={cn(
                    "text-6xl md:text-7xl leading-none font-serif italic tabular-nums",
                    getRiskColor(analysis.riskLevel) === "success" && "text-success",
                    getRiskColor(analysis.riskLevel) === "warning" && "text-warning",
                    getRiskColor(analysis.riskLevel) === "danger" && "text-danger"
                  )}
                >
                  {animatedScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize",
                  getRiskColor(analysis.riskLevel) === "success" && "bg-success/10 text-success",
                  getRiskColor(analysis.riskLevel) === "warning" && "bg-warning/10 text-warning",
                  getRiskColor(analysis.riskLevel) === "danger" && "bg-danger/10 text-danger"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    getRiskColor(analysis.riskLevel) === "success" && "bg-success",
                    getRiskColor(analysis.riskLevel) === "warning" && "bg-warning",
                    getRiskColor(analysis.riskLevel) === "danger" && "bg-danger"
                  )}
                />
                {analysis.riskLevel} risk
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div className="md:col-span-2 bg-card rounded-3xl border border-border p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6">What you're dealing with</h2>
            <div className="space-y-4">
              <RatingRow label="Clarity" value={analysis.clarity} />
              <RatingRow label="Fairness" value={analysis.fairness} />
            </div>
          </div>
        </div>

        {/* Key Issues Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {analysis.keyIssues.map((issue, idx) => (
            <div key={idx} className="bg-card rounded-3xl border border-border p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-danger/20 flex items-center justify-center text-danger text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-xs uppercase tracking-widest text-danger font-medium">Important</span>
              </div>
              <p className="text-base font-medium leading-relaxed">{issue}</p>
            </div>
          ))}
        </div>

        {/* Main Explanation */}
        <div className="bg-card rounded-3xl border border-border p-6 md:p-8 mb-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <h2 className="text-2xl md:text-3xl font-semibold">What this means for you</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {analysis.simpleExplanation}
          </p>
        </div>

        {/* Bottom action bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium text-base shadow-glow transition-smooth"
          >
            Got it, next contract
          </Button>
          <Button
            onClick={() => navigate("/upload")}
            variant="secondary"
            size="lg"
            className="h-14 px-8 rounded-2xl bg-card hover:bg-accent border border-border font-medium transition-smooth"
          >
            Check another
          </Button>
        </div>
      </div>
    </div>
  );
};

const RatingRow = ({ label, value }: { label: string; value: number }) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const getToneColor = (v: number) => {
    if (v >= 70) return "bg-success";
    if (v >= 50) return "bg-warning";
    return "bg-danger";
  };

  return (
    <div className="grid grid-cols-[80px_1fr_50px] items-center gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="h-2.5 rounded-full bg-background overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-[width] duration-1000 ease-out", getToneColor(value))}
          style={{ width: `${w}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums text-right">{value}</span>
    </div>
  );
};

export default Result;
