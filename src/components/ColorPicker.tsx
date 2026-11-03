import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORB_COLORS, useOrbColor } from "@/hooks/use-orb-color";

export const ColorPicker = ({ className }: { className?: string }) => {
  const { color, choose } = useOrbColor();

  return (
    <div role="radiogroup" aria-label="Pick your orb color" className={cn("flex items-center justify-center gap-2", className)}>
      {ORB_COLORS.map((c) => {
        const active = c.id === color.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={c.name}
            title={c.name}
            onClick={() => choose(c.id)}
            className={cn(
              "w-7 h-7 rounded-full grid place-items-center transition-transform duration-150 hover:scale-110 active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-foreground/60",
              active && "ring-2 ring-offset-2 ring-offset-background ring-foreground/70"
            )}
            style={{ background: `hsl(${c.h} ${c.s}% ${Math.max(c.l, 55)}%)` }}
          >
            {active && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
};
