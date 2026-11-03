import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, Keyboard, Mic, RotateCcw, Square, Volume2, VolumeX, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TalkingOrb, type OrbState } from "@/components/TalkingOrb";
import { TypeCaption, type Caption } from "@/components/TypeCaption";
import { ColorPicker } from "@/components/ColorPicker";
import { useListener, useSpeaker } from "@/hooks/use-voice";
import { getContractResult, type StoredContractResult } from "@/lib/supabase";
import { decodeProblem, SEVERITY_META, type Problem } from "@/lib/problems";
import { askAboutDocument, MAX_QUESTION_CHARS, type ChatTurn } from "@/services/ai-lawyer";
import { preloadHumanVoice, unlockAudio } from "@/lib/human-voice";

const CELEBRATIONS = [
  { title: "🏆 Certified human-readable!", description: "This one's surprisingly fair. Enjoy the rare moment." },
  { title: "🎉 No shady paragraph 17?", description: "Whoever wrote this deserves a raise." },
  { title: "✨ 90+ and no red flags", description: "You found a good one." },
];

interface Loaded {
  stored: StoredContractResult;
  problems: Problem[];
  documentType: string;
}

const Result = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const speaker = useSpeaker();
  const [caption, setCaption] = useState<Caption>({ who: "orb", text: "" });
  const [activeLine, setActiveLine] = useState(-1);
  const [asking, setAsking] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const historyRef = useRef<ChatTurn[]>([]);

  useEffect(() => {
    preloadHumanVoice();
    window.scrollTo(0, 0);
  }, []);

  // ─── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      setError("No document ID provided");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const stored = await getContractResult(id);
        if (cancelled) return;
        if (!stored) {
          setError("Couldn't find that document");
          return;
        }
        const problems = (stored.keyIssues ?? []).map(decodeProblem).filter((p) => p.comment);
        setData({ stored, problems, documentType: stored.documentType || "document" });
        setCaption({
          who: "orb",
          text: problems.length
            ? `found ${problems.length} thing${problems.length === 1 ? "" : "s"} to look at. tap replay to hear them`
            : "nothing sketchy in here. tap replay to hear my take",
        });
        if (stored.overallScore >= 90) {
          const msg = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
          toast.success(msg.title, { description: msg.description });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load result");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ─── Spoken script: intro → each problem → overall take → invite questions ─
  const script = useMemo(() => {
    if (!data) return [];
    const n = data.problems.length;
    const doc = data.documentType;
    const pick = (options: string[]) => options[Math.floor(Math.random() * options.length)];
    const count = n === 1 ? "one thing" : `${n} things`;
    const intro =
      n === 0
        ? pick([
            `ok so I read your whole ${doc}. honestly, nothing sketchy in there.`,
            `just went through your ${doc}. good news, I didn't find anything bad.`,
          ])
        : pick([
            `ok so I read your whole ${doc}. there's ${count} you should know about.`,
            `alright, went through your ${doc}. ${count} stood out.`,
            `just read your ${doc}. heads up, there's ${count} I'd look at before signing.`,
          ]);
    return [
      intro,
      ...data.problems.map((p) => p.comment),
      data.stored.simpleExplanation,
      pick(["anything you wanna ask? just tap the mic.", "got questions? tap the mic and ask me."]),
    ];
  }, [data]);

  const say = useCallback(
    (lines: string[], trackProblems = false) => {
      return speaker.speak(lines, {
        waitForHumanMs: 15000,
        onLine: (i) => {
          if (trackProblems) setActiveLine(i);
          if (i >= 0) setCaption({ who: "orb", text: lines[i] });
        },
      });
    },
    [speaker]
  );

  const playBreakdown = useCallback(() => {
    if (!script.length) return;
    unlockAudio();
    if (!speaker.supported || speaker.muted) {
      setCaption({ who: "orb", text: script.slice(1, -1).join("  ") });
      return;
    }
    say(script, true);
  }, [say, script, speaker.supported, speaker.muted]);

  // Auto-start right after an upload (?talk=1) — the drop/click counts as the user gesture.
  useEffect(() => {
    if (!data || params.get("talk") !== "1") return;
    params.delete("talk");
    setParams(params, { replace: true });
    const t = setTimeout(playBreakdown, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ─── Questions ─────────────────────────────────────────────────────────
  const ask = useCallback(
    async (raw: string) => {
      const q = raw.trim().slice(0, MAX_QUESTION_CHARS);
      if (!q || !data || asking) return;
      unlockAudio();
      speaker.stop();
      setActiveLine(-1);
      setCaption({ who: "you", text: q, live: true });
      setAsking(true);
      try {
        const answer = await askAboutDocument(
          q,
          data.stored.contractText ?? "",
          { documentType: data.documentType, problems: data.problems, vibeCheck: data.stored.simpleExplanation },
          historyRef.current,
          import.meta.env.VITE_OPENROUTER_API_KEY
        );
        historyRef.current = [...historyRef.current, { role: "user", content: q }, { role: "assistant", content: answer }];
        setCaption({ who: "orb", text: answer });
        say([answer]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't answer that, try again");
        setCaption({ who: "orb", text: "oops, my brain glitched. try asking again 🙏" });
      } finally {
        setAsking(false);
      }
    },
    [asking, data, say, speaker]
  );

  const listener = useListener((text) => ask(text));

  // Show what you're saying live, so you know it understood you
  useEffect(() => {
    if (listener.listening) {
      setCaption({ who: "you", text: listener.interim || "listening…", live: true });
    } else {
      // Mic closed without hearing anything
      setCaption((c) =>
        c.who === "you" && c.text === "listening…"
          ? { who: "orb", text: "didn't catch that 👂 tap the mic and try again" }
          : c
      );
    }
  }, [listener.listening, listener.interim]);

  const toggleMic = () => {
    unlockAudio();
    if (listener.listening) return listener.stop();
    speaker.stop();
    setActiveLine(-1);
    listener.start();
  };

  const orbState: OrbState = listener.listening
    ? "listening"
    : asking || speaker.warming
      ? "thinking"
      : speaker.speaking
        ? "talking"
        : "idle";

  // ─── States ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <TalkingOrb state="thinking" size={110} className="mx-auto mb-6" />
          <p className="text-muted-foreground">pulling up your doc…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">Oops</h2>
          <p className="text-muted-foreground mb-8">{error || "Nothing to show"}</p>
          <div className="flex gap-3 flex-col sm:flex-row justify-center">
            <Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
            <Button onClick={() => navigate("/upload")} variant="outline">
              Upload another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { stored, problems, documentType } = data;
  const activeProblem = activeLine >= 1 && activeLine <= problems.length ? activeLine - 1 : -1;

  return (
    <div className="min-h-screen px-4 md:px-8 py-5 md:py-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{documentType}</p>
            <h1 className="text-base font-semibold truncate">{stored.fileName}</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/upload")} className="rounded-xl shrink-0">
            New doc
          </Button>
        </div>

        {/* ─── Stage: big orb → typing captions → mic ─── */}
        <section className="min-h-[calc(100dvh-9rem)] md:min-h-[calc(100dvh-7rem)] flex flex-col items-center justify-center py-8 animate-fade-up">
          <TalkingOrb state={orbState} energyRef={speaker.energyRef} size={260} className="scale-[0.8] md:scale-100 -my-6 md:my-0" />

          <TypeCaption caption={caption} className="mt-10 md:mt-12 min-h-[7.5rem] w-full max-w-lg px-2" />
          {(asking || speaker.warming) && (
            <p className="text-sm text-muted-foreground -mt-4 mb-2 animate-pulse">
              {asking
                ? "thinking…"
                : speaker.voiceStatus === "loading"
                  ? `warming up my voice ${Math.round(speaker.voiceProgress * 100)}%…`
                  : "one sec…"}
            </p>
          )}

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-5">
            <Button
              variant="secondary"
              size="icon"
              onClick={speaker.speaking || speaker.warming ? speaker.stop : playBreakdown}
              className="rounded-full h-12 w-12"
              aria-label={speaker.speaking || speaker.warming ? "Stop talking" : "Replay the red flags"}
            >
              {speaker.speaking || speaker.warming ? <Square className="w-4 h-4" /> : <RotateCcw className="w-5 h-5" />}
            </Button>

            {listener.supported ? (
              <button
                type="button"
                onClick={toggleMic}
                disabled={asking}
                aria-label={listener.listening ? "Stop listening" : "Tap to ask a question"}
                aria-pressed={listener.listening}
                className={cn(
                  "relative h-20 w-20 rounded-full grid place-items-center text-primary-foreground bg-primary shadow-glow",
                  "transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                )}
              >
                {listener.listening && <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />}
                {listener.listening ? <Square className="w-6 h-6 relative" fill="currentColor" /> : <Mic className="w-8 h-8 relative" />}
              </button>
            ) : (
              <Button onClick={() => setTyping(true)} className="h-14 rounded-full px-6 shadow-glow">
                <Keyboard className="w-5 h-5" /> Ask
              </Button>
            )}

            <Button
              variant="secondary"
              size="icon"
              onClick={speaker.toggleMute}
              className="rounded-full h-12 w-12"
              aria-label={speaker.muted ? "Unmute voice" : "Mute voice"}
              aria-pressed={speaker.muted}
            >
              {speaker.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {listener.listening ? "tap again when you're done" : "tap the mic to ask about your doc"}
            {listener.supported && !typing && (
              <>
                {" · "}
                <button type="button" onClick={() => setTyping(true)} className="underline underline-offset-2 hover:text-foreground">
                  type instead
                </button>
              </>
            )}
          </p>

          {typing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(draft);
                setDraft("");
              }}
              className="mt-4 w-full max-w-md flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 focus-within:border-primary/50 animate-fade-in"
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_QUESTION_CHARS}
                placeholder={`ask about your ${documentType}…`}
                aria-label="Your question"
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="icon" disabled={!draft.trim() || asking} className="rounded-xl h-10 w-10" aria-label="Send question">
                <ArrowUp className="w-4 h-4" />
              </Button>
            </form>
          )}

          <ColorPicker className="mt-8 scale-90" />
        </section>

        {/* ─── Read it instead ─── */}
        <section className="bezel mb-8">
          <div className="bezel-inner p-5 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{problems.length ? "All the red flags" : "No red flags"}</h2>
              <div className="flex gap-3 text-xs text-muted-foreground tabular-nums">
                <Score label="score" value={stored.overallScore} />
                <Score label="clarity" value={stored.clarity} />
                <Score label="fair" value={stored.fairness} />
              </div>
            </div>

            {problems.length === 0 && (
              <p className="text-muted-foreground">Nothing sketchy jumped out. Still skim it before you sign 🫡</p>
            )}

            <ul className="space-y-1">
              {problems.map((p, i) => (
                <CommentRow key={i} problem={p} active={activeProblem === i} />
              ))}
            </ul>

            <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
              <p className="font-hand text-xl text-primary leading-none mb-1.5">my take</p>
              <p className="font-medium">{stored.simpleExplanation}</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

const CommentRow = ({ problem, active }: { problem: Problem; active: boolean }) => {
  const meta = SEVERITY_META[problem.severity];
  return (
    <li className={cn("flex gap-3 rounded-2xl p-3 -mx-3 transition-colors duration-300", active && "bg-primary/10")}>
      <div className="w-9 h-9 shrink-0 rounded-full orb-body" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13px] mb-0.5">
          <span className="font-semibold">beforeyousign</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-md text-[11px] font-medium",
              problem.severity === "high" && "bg-danger/15 text-danger",
              problem.severity === "medium" && "bg-warning/15 text-warning",
              problem.severity === "low" && "bg-muted text-muted-foreground"
            )}
          >
            {meta.emoji} {meta.label}
          </span>
        </div>
        <p className="text-[15px] md:text-base leading-relaxed">{problem.comment}</p>
        {problem.quote && (
          <p className="mt-1.5 text-sm text-muted-foreground border-l-2 border-border pl-2.5 italic break-words">
            “{problem.quote}”
          </p>
        )}
      </div>
    </li>
  );
};

const Score = ({ label, value }: { label: string; value: number }) => {
  const tone = value >= 70 ? "text-success" : value >= 50 ? "text-warning" : "text-danger";
  return (
    <span>
      <span className={cn("font-semibold text-sm", tone)}>{value}</span> {label}
    </span>
  );
};

export default Result;
