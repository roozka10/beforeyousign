import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalkingOrb } from "@/components/TalkingOrb";
import { TypeCaption, type Caption } from "@/components/TypeCaption";
import { useSpeaker } from "@/hooks/use-voice";
import { preloadHumanVoice, unlockAudio } from "@/lib/human-voice";

/**
 * Hero: a laptop that opens as you scroll, then the orb reads a red flag out loud.
 * Technique studied on apple.com/macbook-pro with REA: a tall section with a sticky
 * stage, scroll progress drives keyframed values written straight to transforms.
 * All markup, styles and code here are original.
 */

const LINES = [
  "ok so I read your lease.",
  "they can raise your rent with 7 days notice.",
  "ask for 60 days before you sign.",
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** Map p in [start, end] → eased [0, 1]. */
const seg = (p: number, start: number, end: number) => {
  const t = clamp((p - start) / (end - start));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const LaptopScroll = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const lidRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const speaker = useSpeaker();
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(false);
  const [caption, setCaption] = useState<Caption>({ who: "orb", text: "" });

  // ─── Scroll-driven 3D ────────────────────────────────────────────────
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lastOpen = false;

    const render = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const p = reduce ? 0.6 : clamp(-el.getBoundingClientRect().top / Math.max(1, total));

      const lidT = seg(p, 0.08, 0.5);
      const settle = seg(p, 0.0, 0.42);
      const zoom = seg(p, 0.55, 0.95);
      const lid = lerp(-87, 12, lidT); // -87 keeps the closed lid just above the keys
      const tilt = lerp(-58, -6, settle); // negative = looking down at the keyboard
      const scale = lerp(0.55, 1, settle) * lerp(1, 1.06, zoom);
      const y = lerp(17, 0, settle); // starts under the headline, rises to center

      if (groupRef.current) {
        groupRef.current.style.transform = `translateY(${y}vh) scale(${scale.toFixed(4)}) rotateX(${tilt.toFixed(2)}deg)`;
      }
      if (lidRef.current) lidRef.current.style.transform = `rotateX(${lid.toFixed(2)}deg)`;
      if (screenRef.current) screenRef.current.style.opacity = String(seg(p, 0.32, 0.5));
      if (introRef.current) {
        const h = seg(p, 0.02, 0.28);
        introRef.current.style.opacity = String(1 - h);
        introRef.current.style.transform = `translateY(${-h * 60}px)`;
        introRef.current.style.pointerEvents = h > 0.5 ? "none" : "auto";
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - seg(p, 0, 0.08));
      if (glowRef.current) glowRef.current.style.opacity = String(0.2 + lidT * 0.8);

      const isOpen = p > 0.5 && p < 0.98;
      if (isOpen !== lastOpen) {
        lastOpen = isOpen;
        setOpen(isOpen);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ─── Talk when the lid is open ────────────────────────────────────────
  const talk = useCallback(() => {
    if (!sound) {
      setCaption({ who: "orb", text: LINES.slice(1).join(" ") });
      return;
    }
    speaker.speak(LINES, {
      waitForHumanMs: 30000,
      onLine: (i) => {
        if (i >= 0) setCaption({ who: "orb", text: LINES[i] });
      },
    });
  }, [sound, speaker]);

  useEffect(() => {
    if (open) talk();
    else {
      speaker.stop();
      setCaption({ who: "orb", text: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sound]);

  const toggleSound = () => {
    if (sound) {
      setSound(false);
      speaker.stop();
      return;
    }
    unlockAudio(); // this tap is what lets the browser play the voice
    preloadHumanVoice();
    setSound(true);
  };

  const orbState = speaker.warming ? "thinking" : speaker.speaking || (!sound && open) ? "talking" : "idle";
  const soundLabel = !sound
    ? "Sound on"
    : speaker.warming && speaker.voiceStatus === "loading"
      ? `Loading voice ${Math.round(speaker.voiceProgress * 100)}%`
      : "Sound off";

  return (
    <section ref={sectionRef} className="relative h-[300vh]" aria-label="Hero: a laptop opens and the orb reads a lease">
      <div className="sticky top-0 h-[100dvh] overflow-hidden flex flex-col items-center px-4">
        <div ref={glowRef} className="absolute top-1/3 w-[80vw] h-[55vh] rounded-full blur-3xl bg-primary/20 pointer-events-none" />

        {/* Headline */}
        <div ref={introRef} className="relative z-10 pt-24 md:pt-32 text-center max-w-3xl will-change-transform">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
            Find what could <span className="font-serif italic text-primary">screw you</span> in the fine print
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-4 md:mt-5 max-w-xl mx-auto">
            Drop any document. A talking orb reads it and tells you <span className="marker">only the problems</span>, out loud.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6 md:mt-7">
            <Link to="/login">
              <Button size="lg" className="h-12 px-6 rounded-2xl font-medium shadow-glow">
                Get started free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              onClick={toggleSound}
              aria-pressed={sound}
              className="h-12 px-5 rounded-2xl font-medium"
            >
              {sound ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {soundLabel}
            </Button>
          </div>
          <div ref={hintRef} className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="w-4 h-6 rounded-full border-[1.5px] border-muted-foreground/50 flex justify-center pt-1">
              <span className="w-0.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
            </span>
            scroll to open it
          </div>
        </div>

        {/* 3D stage */}
        <div className="absolute inset-0 pt-16 flex items-center justify-center" style={{ perspective: "1800px" }}>
          <div
            ref={groupRef}
            className="relative will-change-transform"
            style={{
              transformStyle: "preserve-3d",
              width: "min(86vw, 760px, calc((100dvh - 150px) * 1.2))",
              aspectRatio: "16 / 10.4",
            }}
          >
            {/* Lid, hinged at its bottom edge */}
            <div
              ref={lidRef}
              className="absolute inset-0"
              style={{ transformOrigin: "50% 100%", transformStyle: "preserve-3d", transform: "rotateX(-87deg)" }}
            >
              <div
                className="absolute inset-0 rounded-[2.2%/3.4%] bg-[#0b0b0c] p-[1.6%]"
                style={{ backfaceVisibility: "hidden", boxShadow: "0 0 0 1.5px #3a3a3e inset, 0 30px 80px -20px rgba(0,0,0,.7)" }}
              >
                <div className="relative w-full h-full rounded-[1.2%/1.8%] overflow-hidden bg-background">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[14%] h-[3.2%] bg-[#0b0b0c] rounded-b-md z-10" />
                  <div ref={screenRef} className="absolute inset-0 flex flex-col items-center justify-center gap-[4%] px-[8%] opacity-0">
                    <TalkingOrb state={orbState} energyRef={speaker.energyRef} size={130} className="scale-[0.6] md:scale-100 -my-6 md:my-0" />
                    <TypeCaption caption={caption} className="w-full min-h-[5.5em] [&_p:last-child]:text-sm md:[&_p:last-child]:text-xl" />
                  </div>
                </div>
              </div>
              {/* Back of the lid */}
              <div
                className="absolute inset-0 rounded-[2.2%/3.4%] grid place-items-center"
                style={{
                  transform: "rotateX(180deg)",
                  backfaceVisibility: "hidden",
                  background: "linear-gradient(160deg, #3b3b40, #26262a 60%, #1d1d20)",
                  boxShadow: "0 0 0 1px #4a4a50 inset",
                }}
              >
                <div className="w-[9%] aspect-square rounded-full orb-body opacity-90" />
              </div>
            </div>

            {/* Base, lying flat and hinged at its top edge */}
            <div
              className="absolute left-[-4%] right-[-4%] top-full h-full"
              style={{
                transformOrigin: "50% 0%",
                transform: "rotateX(90deg)",
                background: "linear-gradient(180deg, #2f2f33, #242427)",
                borderRadius: "0 0 3% 3% / 0 0 6% 6%",
                boxShadow: "0 0 0 1px #45454b inset",
              }}
            >
              <div className="absolute inset-x-[9%] top-[8%] h-[46%] grid grid-cols-[repeat(14,1fr)] grid-rows-5 gap-[0.6%]">
                {Array.from({ length: 70 }).map((_, i) => (
                  <span key={i} className="rounded-[2px] bg-[#151517]" />
                ))}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[9%] w-[36%] h-[28%] rounded-md bg-[#2a2a2e] shadow-[inset_0_0_0_1px_#45454b]" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
