import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalkingOrb } from "@/components/TalkingOrb";
import { HoopShot, type HoopShotHandle } from "@/components/HoopShot";
import { analyzeContractWithContext } from "@/lib/contract-analysis-helper";
import { saveContractResult, supabase } from "@/lib/supabase";
import { ACCEPTED_FILE_TYPES, extractTextFromFile } from "@/lib/pdf-extractor";
import { encodeProblem } from "@/lib/problems";
import type { UserContext } from "@/services/ai-lawyer";
import { preloadHumanVoice, unlockAudio } from "@/lib/human-voice";

const THINKING_LINES = [
  "reading every single line so you don't have to…",
  "hunting for sus clauses 🔍",
  "checking the fine print they hoped you'd skip…",
  "writing your red flags rn ✍️",
];

type Stage = "pick" | "shoot" | "reading";
type JobResult = { id: string } | { error: Error };

const UploadPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const hoopRef = useRef<HoopShotHandle>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [line, setLine] = useState(0);
  const dragDepth = useRef(0);
  const jobRef = useRef<Promise<JobResult> | null>(null);
  const scoredRef = useRef(false);

  // Download the human voice while they play, so it's ready for the results.
  useEffect(() => {
    preloadHumanVoice();
  }, []);

  useEffect(() => {
    if (stage !== "reading") return;
    setLine(0);
    const t = setInterval(() => setLine((i) => Math.min(i + 1, THINKING_LINES.length - 1)), 1800);
    return () => clearInterval(t);
  }, [stage]);

  const reset = (message: string) => {
    jobRef.current = null;
    scoredRef.current = false;
    setError(message);
    setFileName(null);
    setMisses(0);
    setStage("pick");
  };

  /** Extract → analyze → save. Starts the moment the file is picked. */
  const runJob = async (file: File, userId: string): Promise<string> => {
    const text = await extractTextFromFile(file);
    if (!text.trim()) throw new Error("Couldn't find any text in that file. Is it a scan or a photo?");

    const location =
      localStorage.getItem(`bys_user_location_${userId}`) ?? localStorage.getItem("bys_user_location") ?? "United States";
    const context: UserContext = { location };
    const analysis = await analyzeContractWithContext(text, file.name, context);

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
      userId
    );
    return saved.id;
  };

  const handleFile = async (file: File) => {
    if (!file || stage === "reading") return;
    unlockAudio(); // this click/drop lets the results page talk right away

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Sign in first so we can save your results.");
      navigate("/login");
      return;
    }

    setError(null);
    setMisses(0);
    scoredRef.current = false;
    setFileName(file.name);
    setStage("shoot");

    const job: Promise<JobResult> = runJob(file, session.user.id).then(
      (id) => ({ id }),
      (err) => ({ error: err instanceof Error ? err : new Error("Something broke, try again.") })
    );
    jobRef.current = job;

    // If it fails while they're still aiming, tell them right away.
    job.then((r) => {
      if (jobRef.current !== job || scoredRef.current || !("error" in r)) return;
      console.error("Failed to analyze document:", r.error);
      reset(r.error.message);
    });
  };

  const handleScore = async () => {
    const job = jobRef.current;
    if (!job) return;
    scoredRef.current = true;
    setStage("reading");
    const r = await job;
    if (jobRef.current !== job) return;
    if ("error" in r) {
      console.error("Failed to analyze document:", r.error);
      reset(r.error.message);
      return;
    }
    // ?talk=1 tells the result page to start speaking right away
    navigate(`/result/${r.id}?talk=1`);
  };

  const pick = () => stage !== "reading" && inputRef.current?.click();

  const heading = {
    pick: { hand: "feed me a doc 👇", title: "Drop any document", sub: "Lease, job offer, NDA, terms, bills. Then shoot it into the hoop and I'll tell you the red flags." },
    shoot: { hand: "ok now shoot 🏀", title: "Sink it to send it", sub: "Pull the ball back, aim at the hoop, let go. (I'm already reading it btw)" },
    reading: { hand: "one sec", title: "Reading it rn…", sub: THINKING_LINES[line] },
  }[stage];

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 md:py-14"
      onDragEnter={(e) => {
        e.preventDefault();
        if (stage === "reading") return;
        dragDepth.current++;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
    >
      <div className="w-full max-w-xl text-center animate-fade-up">
        <p className="font-hand text-2xl text-primary mb-1 -rotate-2">{heading.hand}</p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3">{heading.title}</h1>
        <p className="text-muted-foreground text-base md:text-lg mb-6 md:mb-8 max-w-md mx-auto min-h-[3em]" aria-live="polite">
          {heading.sub}
        </p>

        <div className="relative">
          <HoopShot
            ref={hoopRef}
            fileName={fileName}
            onPickRequest={pick}
            onScore={handleScore}
            onMiss={setMisses}
            dragging={dragging && stage === "pick"}
          />

          {stage === "reading" && (
            <div className="absolute inset-0 z-50 grid place-items-center rounded-[28px] bg-background/60 backdrop-blur-[2px] animate-fade-in">
              <TalkingOrb state="thinking" size={140} />
            </div>
          )}
        </div>

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

        <div className="mt-5 min-h-[64px]">
          {stage === "shoot" && (
            <>
              <p className="text-sm text-muted-foreground font-mono truncate mb-3">{fileName}</p>
              <Button
                variant={misses >= 1 ? "default" : "ghost"}
                size="sm"
                onClick={() => hoopRef.current?.autoShoot()}
                className="rounded-xl"
              >
                <Wand2 className="w-4 h-4" />
                {misses >= 1 ? "just shoot it for me 🙏" : "aim assist"}
              </Button>
            </>
          )}
          {stage === "reading" && <p className="text-sm text-muted-foreground font-mono truncate">{fileName}</p>}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger animate-fade-in"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
