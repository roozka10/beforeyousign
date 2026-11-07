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
 * The beforeyousign mascot: the brand logo, brought to life.
 * Floats when idle, spins a ring while thinking, bounces with the voice
 * while talking, ripples while listening. Motion is written straight to the
 * DOM each frame, so React never re-renders.
 */
export const TalkingOrb = ({ state, energyRef, size = 220, className }: TalkingOrbProps) => {
  const bodyRef = useRef<HTMLImageElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let energy = 0;
    let bounce = 0;

    const tick = (t: number) => {
      const s = stateRef.current;
      if (energyRef && energyRef.current > energy) energy = energyRef.current;
      if (energyRef) energyRef.current *= 0.85;
      energy *= 0.9;

      // Some voices never fire word events, so add a syllable-like wobble while talking.
      const syllables = 0.45 + 0.55 * Math.abs(Math.sin(t / 95) * Math.sin(t / 233));
      const target = s === "talking" ? Math.max(energy, syllables) : 0;
      bounce += (target - bounce) * 0.35;

      if (bodyRef.current) {
        if (reduce) {
          bodyRef.current.style.transform = "";
        } else {
          const float = Math.sin(t / 1100) * size * 0.02;
          const base = s === "dragging" ? 1.08 : s === "listening" ? 1.03 : 1;
          const squash = bounce * 0.06;
          const tilt = s === "thinking" ? Math.sin(t / 420) * 4 : s === "talking" ? Math.sin(t / 160) * bounce * 3 : 0;
          bodyRef.current.style.transform =
            `translateY(${(float - bounce * size * 0.04).toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) ` +
            `scale(${(base + squash * 0.6).toFixed(4)}, ${(base - squash * 0.4 + squash).toFixed(4)})`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [energyRef, size]);

  const label = {
    idle: "beforeyousign is waiting",
    dragging: "Drop it here",
    thinking: "beforeyousign is reading your document",
    talking: "beforeyousign is talking",
    listening: "beforeyousign is listening",
  }[state];

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
          "absolute inset-[-10%] rounded-full blur-2xl transition-opacity duration-500 mascot-glow",
          state === "idle" ? "opacity-40" : "opacity-80"
        )}
      />

      {state === "listening" &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-[4%] rounded-full border-2 orb-ripple"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}

      <div
        className={cn(
          "absolute inset-[-2%] rounded-full orb-ring transition-opacity duration-300",
          state === "thinking" ? "opacity-100" : "opacity-0"
        )}
      />

      <img
        ref={bodyRef}
        src="/logo.png"
        alt=""
        draggable={false}
        className="relative w-[88%] h-[88%] object-contain will-change-transform drop-shadow-[0_14px_24px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
};

/** Small logo avatar for comment rows and chat bubbles. */
export const LogoAvatar = ({ className }: { className?: string }) => (
  <img src="/logo.png" alt="" aria-hidden draggable={false} className={cn("shrink-0 object-contain", className)} />
);
