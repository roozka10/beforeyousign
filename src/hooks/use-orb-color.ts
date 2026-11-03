import { useCallback, useEffect, useState } from "react";

export interface OrbColor {
  id: string;
  name: string;
  h: number;
  s: number;
  /** Lightness for buttons/accents — darker for hues that need it for white-text contrast. */
  l: number;
}

export const ORB_COLORS: OrbColor[] = [
  { id: "orange", name: "Orange", h: 17, s: 85, l: 56 },
  { id: "pink", name: "Pink", h: 330, s: 80, l: 58 },
  { id: "purple", name: "Purple", h: 265, s: 75, l: 62 },
  { id: "blue", name: "Blue", h: 215, s: 85, l: 56 },
  { id: "teal", name: "Teal", h: 172, s: 70, l: 40 },
  { id: "green", name: "Green", h: 142, s: 60, l: 42 },
  { id: "red", name: "Red", h: 0, s: 78, l: 58 },
];

const STORAGE_KEY = "bys_orb_color";
const EVENT = "bys:orb-color";

function find(id: string | null): OrbColor {
  return ORB_COLORS.find((c) => c.id === id) ?? ORB_COLORS[0];
}

function readSaved(): OrbColor {
  try {
    return find(localStorage.getItem(STORAGE_KEY));
  } catch {
    return ORB_COLORS[0];
  }
}

/** Paint the orb + the app accent with the chosen color. */
export function applyOrbColor(color: OrbColor = readSaved()) {
  const root = document.documentElement.style;
  const accent = `${color.h} ${color.s}% ${color.l}%`;
  root.setProperty("--orb-h", String(color.h));
  root.setProperty("--orb-s", `${color.s}%`);
  for (const v of ["--primary", "--ring", "--sidebar-primary", "--sidebar-ring"]) {
    root.setProperty(v, accent);
  }
}

export function useOrbColor() {
  const [color, setColor] = useState<OrbColor>(readSaved);

  useEffect(() => {
    const sync = () => setColor(readSaved());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const choose = useCallback((id: string) => {
    const next = find(id);
    try {
      localStorage.setItem(STORAGE_KEY, next.id);
    } catch {
      /* private mode — still apply for this visit */
    }
    applyOrbColor(next);
    setColor(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { color, choose };
}
