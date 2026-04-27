import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeContractWithContext } from "@/lib/contract-analysis-helper";
import { saveContractResult, supabase } from "@/lib/supabase";
import { extractTextFromFile } from "@/lib/pdf-extractor";
import { getUserCredits, deductCredit } from "@/lib/stripe";
import { toast } from "sonner";
import type { UserContext } from "@/services/ai-lawyer";

const loadingMessages = [
  "Reading your contract…",
  "Looking for sketchy stuff…",
  "Scoring your deal…",
  "Almost there…",
];

const UploadPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, loadingMessages.length - 1));
    }, 1200);
    return () => clearInterval(t);
  }, [loading]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Check user has credits or an active unlimited plan
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Please sign in to analyse a contract.");
      navigate("/login");
      return;
    }

    const { credits, plan } = await getUserCredits();
    if (plan !== "unlimited" && credits <= 0) {
      toast.error("You're out of credits. Buy more to continue.");
      navigate("/pricing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

      if (!apiKey) {
        throw new Error("OpenRouter API key not configured");
      }

      // Extract text from file (handles PDF, DOCX, TXT)
      const fileContent = await extractTextFromFile(file);

      // Validate extraction
      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error(
          "Could not extract text from this file. Please ensure the PDF contains readable text or try a different file format."
        );
      }

      if (fileContent.length < 100) {
        console.warn(
          `⚠️ Warning: Extracted text is very short (${fileContent.length} chars). This might be a scan or image-based PDF.`
        );
      }

      const userLocation =
        localStorage.getItem(`bys_user_location_${session.user.id}`) ??
        localStorage.getItem("bys_user_location") ??
        "United States";

      const userContext: UserContext = {
        location: userLocation,
      };

      // Analyze with AI
      const analysis = await analyzeContractWithContext(
        fileContent,
        file.name,
        userContext,
        apiKey
      );

      // Save to Supabase
      const savedResult = await saveContractResult({
        fileName: file.name,
        overallScore: analysis.overallScore,
        clarity: analysis.clarity,
        fairness: analysis.fairness,
        riskLevel: analysis.riskLevel,
        keyIssues: analysis.keyIssues,
        simpleExplanation: analysis.simpleExplanation,
        userLocation,
        contractText: fileContent,
      }, session.user.id);

      // Deduct one credit for pay-per-use users
      if (plan !== "unlimited") {
        await deductCredit(session.user.id);
      }

      // Navigate to result with the real UUID
      navigate(`/result/${savedResult.id}`);
    } catch (err) {
      console.error("Failed to analyze contract:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze contract. Please try again."
      );
      setLoading(false);
    }
  };

  const startUpload = () => {
    if (inputRef.current?.files?.[0]) {
      handleFileUpload(inputRef.current.files[0]);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 md:px-6 py-10 md:py-16">
      <div className="w-full max-w-2xl animate-fade-up">
        {!loading ? (
          <>
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3 md:mb-4">
                Drop your contract here
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Let's see what's actually going on in there.
              </p>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-6 md:mb-8 text-danger text-sm">
                {error}
              </div>
            )}

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className={cn(
                "block rounded-3xl border-2 border-dashed p-8 md:p-16 text-center cursor-pointer transition-smooth bg-card",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40 hover:bg-card/80"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={() => startUpload()}
              />
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-background grid place-items-center mx-auto mb-5 md:mb-6">
                <UploadCloud className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              </div>
              <p className="text-lg md:text-xl font-semibold mb-2">
                <span className="hidden md:inline">Drag a file in</span>
                <span className="md:hidden">Tap to select a file</span>
              </p>
              <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">
                PDF, DOCX, or TXT — we'll handle the rest.
              </p>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  inputRef.current?.click();
                }}
                size="lg"
                className="h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:brightness-110 text-primary-foreground font-medium px-6 shadow-glow transition-smooth"
              >
                Pick a file
              </Button>
            </label>
          </>
        ) : (
          <div className="bg-card rounded-3xl p-10 md:p-16 border border-border shadow-elevated text-center animate-scale-in">
            <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-8 md:mb-10">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary grid place-items-center shadow-glow">
                <FileText className="w-8 h-8 md:w-9 md:h-9 text-primary-foreground" />
              </div>
            </div>
            <p
              key={msgIndex}
              className="text-2xl md:text-3xl font-medium animate-fade-in tracking-tight"
            >
              {loadingMessages[msgIndex]}
            </p>
            <p className="text-muted-foreground mt-3 md:mt-4 text-base md:text-lg">
              Hang tight, almost done.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
