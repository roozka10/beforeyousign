import { useEffect, useRef, type MutableRefObject } from "react";
import { cn } from "@/lib/utils";

export type OrbState = "idle" | "dragging" | "thinking" | "talking" | "listening";

interface TalkingOrbProps {
  state: OrbState;
  /** 0..1 ref bumped on each spoken word (from useSpeaker). */
  energyRef?: MutableRefObject<number>;
  size?: number;
  className?: string;
}

/**
 * The beforeyousign orb — a soft, cute circle with a face.
 * Color comes from --orb-h / --orb-s (see useOrbColor).
 * Mouth + bounce are animated per-frame straight on the DOM, so React never re-renders.
 */
export const TalkingOrb = ({ state, energyRef, size = 220, className }: TalkingOrbProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<HTMLDivElement>(null);
  const smileRef = useRef<SVGSVGElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let energy = 0;
    let open = 0;

    const tick = (t: number) => {
      const s = stateRef.current;
      if (energyRef && energyRef.current > energy) energy = energyRef.current;
      if (energyRef) energyRef.current *= 0.85;
      energy *= 0.9;

      // Some voices never fire word events, so add a syllable-like wobble while talking.
      const syllables = 0.45 + 0.55 * Math.abs(Math.sin(t / 95) * Math.sin(t / 233));
      const target = s === "talking" ? Math.max(energy, syllables) : 0;
      open += (target - open) * 0.35;

      const breathe = reduce ? 0 : Math.sin(t / 1100) * 0.012;
      const squash = reduce ? 0 : open * 0.035;
      const base = s === "dragging" ? 1.08 : s === "listening" ? 1.03 : 1;
      if (bodyRef.current) {
        bodyRef.current.style.transform = `scale(${(base + breathe + squash).toFixed(4)}, ${(base + breathe - squash * 0.6).toFixed(4)})`;
      }
      if (mouthRef.current) {
        mouthRef.current.style.transform = `translateX(-50%) scale(${(0.7 + open * 0.3).toFixed(3)}, ${Math.max(0.05, open).toFixed(3)})`;
        mouthRef.current.style.opacity = open > 0.06 ? "1" : "0";
      }
      if (smileRef.current) smileRef.current.style.opacity = String(Math.max(0, 1 - open * 3));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [energyRef]);

  const label = {
    idle: "Orb is waiting",
    dragging: "Drop it on the orb",
    thinking: "Orb is reading your document",
    talking: "Orb is talking",
    listening: "Orb is listening",
  }[state];

  const eye = size * 0.085;
  const happy = state === "dragging" || state === "listening";

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative grid place-items-center select-none", className)}
      style={{ width: size, height: size }}
      data-state={state}
    >
      <div
        className={cn(
          "absolute inset-[-14%] rounded-full blur-2xl transition-opacity duration-500 orb-glow",
          state === "idle" ? "opacity-40" : "opacity-80"
        )}
      />

      {state === "listening" &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-full border-2 orb-ripple"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}

      <div
        className={cn(
          "absolute inset-[-5%] rounded-full orb-ring transition-opacity duration-300",
          state === "thinking" ? "opacity-100" : "opacity-0"
        )}
      />

      <div ref={bodyRef} className="relative w-full h-full rounded-full orb-body will-change-transform">
        <div className="absolute inset-0 rounded-full orb-shine" />

        {/* Eyes */}
        <div
          className={cn(
            "absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 flex justify-center",
            state === "thinking" && "orb-eyes-think"
          )}
          style={{ gap: size * 0.17 }}
        >
          {[0, 1].map((i) =>
            happy ? (
              // ^ ^ happy eyes
              <svg key={i} width={eye * 1.3} height={eye} viewBox="0 0 13 10" aria-hidden>
                <path d="M1.5 8.5 Q6.5 0 11.5 8.5" fill="none" stroke="hsl(var(--orb-ink))" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            ) : (
              <span
                key={i}
                className="relative block rounded-full orb-eye"
                style={{ width: eye, height: eye * 1.15, background: "hsl(var(--orb-ink))" }}
              >
                <span
                  className="absolute rounded-full bg-white"
                  style={{ width: eye * 0.36, height: eye * 0.36, top: eye * 0.16, left: eye * 0.18 }}
                />
              </span>
            )
          )}
        </div>

        {/* Blush */}
        {[0, 1].map((i) => (
          <span
            key={i}
            className="absolute top-[55%] rounded-full orb-blush"
            style={{
              width: size * 0.13,
              height: size * 0.07,
              [i === 0 ? "left" : "right"]: "17%",
            }}
          />
        ))}

        {/* Idle smile */}
        <svg
          ref={smileRef}
          className="absolute left-1/2 top-[57%] -translate-x-1/2"
          width={size * 0.14}
          height={size * 0.07}
          viewBox="0 0 20 10"
          aria-hidden
        >
          <path d="M2 2 Q10 10 18 2" fill="none" stroke="hsl(var(--orb-ink))" strokeWidth="2.4" strokeLinecap="round" />
        </svg>

        {/* Talking mouth */}
        <div
          ref={mouthRef}
          className="absolute left-1/2 top-[57%] origin-top overflow-hidden"
          style={{
            width: size * 0.15,
            height: size * 0.12,
            borderRadius: "40% 40% 50% 50% / 30% 30% 70% 70%",
            background: "hsl(var(--orb-ink))",
            opacity: 0,
          }}
        >
          <span
            className="absolute left-1/2 -translate-x-1/2 bottom-[-20%] rounded-full"
            style={{ width: "70%", height: "55%", background: "hsl(350 80% 72%)" }}
          />
        </div>
      </div>
    </div>
  );
};
