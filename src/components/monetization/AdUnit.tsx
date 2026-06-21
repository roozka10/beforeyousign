import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type AdUnitProps = {
  className?: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  label?: string;
};

export const AdUnit = ({
  className,
  format = "auto",
  label = "Advertisement",
}: AdUnitProps) => {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by ad blocker or script not loaded yet.
    }
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-2 text-center">
        {label}
      </p>
      <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden min-h-[90px]">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-2098929307010637"
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
