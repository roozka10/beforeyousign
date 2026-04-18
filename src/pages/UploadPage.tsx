import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/lib/onboarding-context";
import { analyzeContractWithContext } from "@/lib/contract-analysis-helper";
import { saveContractResult } from "@/lib/supabase";
import { extractTextFromFile } from "@/lib/pdf-extractor";

const loadingMessages = [
  "Reading your contract…",
  "Looking for sketchy stuff…",
  "Scoring your deal…",
  "Almost there…",
];

const UploadPage = () => {
  const navigate = useNavigate();
  const { data: onboardingData } = useOnboarding();
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

      console.log(`✅ Extracted ${fileContent.length} characters from ${file.name}`);

      // Analyze with AI
      const analysis = await analyzeContractWithContext(
        fileContent,
        file.name,
        onboardingData,
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
        userLocation: onboardingData?.location || "United States",
        documentType: onboardingData?.documentType,
        mainConcern: onboardingData?.mainConcern,
        contractText: fileContent,
      });

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
    <div className="min-h-screen grid place-items-center px-6 py-16">
      <div className="w-full max-w-2xl animate-fade-up">
        {!loading ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-5xl font-semibold tracking-tight mb-4">
                Drop your contract here
              </h1>
              <p className="text-muted-foreground text-lg">
                Let's see what's actually going on in there.
              </p>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-8 text-danger text-sm">
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
                "block rounded-3xl border-2 border-dashed p-16 text-center cursor-pointer transition-smooth bg-card",
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
              <div className="w-16 h-16 rounded-2xl bg-background grid place-items-center mx-auto mb-6">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xl font-semibold mb-2">Drag a file in</p>
              <p className="text-muted-foreground mb-8">
                PDF, DOCX, or TXT works — we'll handle the rest.
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
          <div className="bg-card rounded-3xl p-16 border border-border shadow-elevated text-center animate-scale-in">
            <div className="relative w-20 h-20 mx-auto mb-10">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-2xl bg-primary grid place-items-center shadow-glow">
                <FileText className="w-9 h-9 text-primary-foreground" />
              </div>
            </div>
            <p
              key={msgIndex}
              className="text-3xl font-medium animate-fade-in tracking-tight"
            >
              {loadingMessages[msgIndex]}
            </p>
            <p className="text-muted-foreground mt-4 text-lg">
              Hang tight, almost done.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
