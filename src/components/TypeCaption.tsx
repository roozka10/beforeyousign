import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface Caption {
  who: "orb" | "you";
  text: string;
  /** Live captions (your speech) render instantly instead of typing out. */
  live?: boolean;
}

/** Keyboard-typing captions, paced close to speaking speed (~16 chars/sec). */
export const TypeCaption = ({ caption, className }: { caption: Caption; className?: string }) => {
  const [shown, setShown] = useState(caption.live ? caption.text.length : 0);

  useEffect(() => {
    if (caption.live) {
      setShown(caption.text.length);
      return;
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(caption.text.length);
      return;
    }
    setShown(0);
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= caption.text.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 58);
    return () => clearInterval(id);
  }, [caption.text, caption.live]);

  const typing = shown < caption.text.length || caption.live;

  return (
    <div className={cn("text-center", className)} aria-live="polite">
      <p
        className={cn(
          "text-[11px] uppercase tracking-[0.18em] font-semibold mb-2",
          caption.who === "you" ? "text-muted-foreground" : "text-primary"
        )}
      >
        {caption.who === "you" ? "you" : "beforeyousign"}
      </p>
      {/* Full text for screen readers; typed text is visual only */}
      <span className="sr-only">{caption.text}</span>
      <p
        aria-hidden
        className={cn(
          "text-xl md:text-2xl font-medium leading-snug tracking-tight text-balance",
          caption.who === "you" && "text-muted-foreground"
        )}
      >
        {caption.text.slice(0, shown)}
        <span
          className={cn(
            "inline-block w-[2px] h-[1.05em] align-[-0.12em] ml-0.5 bg-primary",
            typing ? "animate-pulse" : "opacity-0"
          )}
        />
      </p>
    </div>
  );
};
