import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalkingOrb, type OrbState } from "@/components/TalkingOrb";
import { ColorPicker } from "@/components/ColorPicker";
import { analyzeContractWithContext } from "@/lib/contract-analysis-helper";
import { saveContractResult, supabase } from "@/lib/supabase";
import { ACCEPTED_FILE_TYPES, extractTextFromFile } from "@/lib/pdf-extractor";
import { encodeProblem } from "@/lib/problems";
import type { UserContext } from "@/services/ai-lawyer";

const THINKING_LINES = [
  "reading every single line so you don't have to…",
  "hunting for sus clauses 🔍",
  "checking the fine print they hoped you'd skip…",
  "writing your red flags rn ✍️",
];

const UploadPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<OrbState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [line, setLine] = useState(0);
  const dragDepth = useRef(0);
  const busy = state === "thinking";

  useEffect(() => {
    if (!busy) return;
    setLine(0);
    const t = setInterval(() => setLine((i) => Math.min(i + 1, THINKING_LINES.length - 1)), 1800);
    return () => clearInterval(t);
  }, [busy]);

  const handleFile = async (file: File) => {
    if (!file || busy) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Sign in first so we can save your results.");
      navigate("/login");
      return;
    }

    setFileName(file.name);
    setError(null);
    setState("thinking");

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("OpenRouter API key not configured");

      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        throw new Error("Couldn't find any text in that file. Is it a scan or a photo?");
      }

      const location =
        localStorage.getItem(`bys_user_location_${session.user.id}`) ??
        localStorage.getItem("bys_user_location") ??
        "United States";
      const context: UserContext = { location };

      const analysis = await analyzeContractWithContext(text, file.name, context, apiKey);

      const saved = await saveContractResult(
        {
          fileName: file.name,
          overallScore: analysis.overallScore,
          clarity: analysis.clarity,
          fairness: analysis.fairness,
          riskLevel: analysis.riskLevel,
          keyIssues: analysis.problems.map(encodeProblem),
          simpleExplanation: analysis.vibeCheck,
          documentType: analysis.documentType,
          userLocation: location,
          contractText: text,
        },
        session.user.id
      );

      // ?talk=1 tells the result page to start speaking right away
      navigate(`/result/${saved.id}?talk=1`);
    } catch (err) {
      console.error("Failed to analyze document:", err);
      setError(err instanceof Error ? err.message : "Something broke, try again.");
      setState("idle");
    }
  };

  const pick = () => !busy && inputRef.current?.click();

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12 md:py-16"
      onDragEnter={(e) => {
        e.preventDefault();
        if (busy) return;
        dragDepth.current++;
        setState("dragging");
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        if (busy) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setState("idle");
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
        else setState("idle");
      }}
    >
      <div className="w-full max-w-xl text-center animate-fade-up">
        <p className="font-hand text-2xl text-primary mb-2 -rotate-2">
          {busy ? "one sec bestie" : "feed me a doc 👇"}
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3">
          {busy ? "Reading it rn…" : "Drop any document on me"}
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mb-10 md:mb-12 max-w-md mx-auto">
          {busy
            ? THINKING_LINES[line]
            : "Lease, job offer, NDA, terms, bills — I'll say the red flags out loud, then you can ask me anything about it."}
        </p>

        <button
          type="button"
          onClick={pick}
          disabled={busy}
          aria-label="Pick a document to analyze"
          className="mx-auto block rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 disabled:cursor-progress cursor-pointer"
        >
          <TalkingOrb state={state} size={200} className="mx-auto md:scale-110" />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        <div className="mt-12 md:mt-14 min-h-[88px]">
          {busy ? (
            <p className="text-sm text-muted-foreground font-mono truncate">{fileName}</p>
          ) : (
            <>
              <Button
                onClick={pick}
                size="lg"
                className="h-12 rounded-2xl px-6 font-medium shadow-glow"
              >
                <Upload className="w-4 h-4" />
                Pick a file
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                PDF · DOCX · TXT · RTF · HTML · Markdown · CSV
              </p>
              <ColorPicker className="mt-6" />
            </>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger animate-fade-in"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
