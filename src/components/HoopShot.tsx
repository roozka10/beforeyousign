import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Upload as a game:
 *  1. a normal drop-in card
 *  2. your file appears as a sheet of paper that folds up and crumples into a ball
 *  3. pull back + let go to shoot it into the hoop → it gets sent to the AI
 *
 * It's meant to be easy: big rim, full aim guide, and the hoop "pulls" the
 * ball in when it gets close. After a miss the guide gets even stronger.
 * Physics runs in rAF and writes straight to the DOM.
 */

const G = 1500; // gravity, px/s²
const R = 22; // ball radius
const MAX_PULL = 130;
const POWER = 10.5; // launch speed per px of pull (a medium pull reaches the rim)
const RIM_KNOB = 3;
const DOTS = 18;
const FOLD_MS = 1500; // paper fold + crumple
const TRAVEL_MS = 450; // ball flies from the card center to the shooting spot

export type HoopPhase = "empty" | "folding" | "rolling" | "ready" | "aiming" | "flying" | "scored";

export interface HoopShotHandle {
  /** Perfect shot, for people who'd rather not aim (or can't). */
  autoShoot: () => void;
}

interface HoopShotProps {
  fileName: string | null;
  dragging?: boolean;
  onPickRequest: () => void;
  onScore: () => void;
  onMiss?: (misses: number) => void;
  className?: string;
}

const MISS_LINES = ["so close lol", "almost! the hoop's helping you now", "the rim said no 😭", "ok again, you got this"];
const SCORE_LINES = ["SWISH!", "BUCKETS!", "nothing but net", "sent to the AI 🚀"];
const CONFETTI = ["#e1663f", "#ffb38a", "#ffd166", "#ffffff", "#f78fb3", "#7bdff2"];

function getLayout(W: number, H: number) {
  const rimW = W < 420 ? 104 : 120;
  const rimCX = Math.min(W * 0.72, W - rimW / 2 - 34);
  const rimY = Math.round(H * 0.34);
  return {
    W,
    H,
    rimW,
    rimCX,
    rimY,
    rimL: rimCX - rimW / 2,
    rimR: rimCX + rimW / 2,
    boardX: rimCX + rimW / 2 + 8,
    boardTop: rimY - 96,
    boardBot: rimY + 18,
    floor: H - 18,
    ax: Math.max(R + 40, Math.round(W * 0.2)),
    ay: H - 120,
  };
}
type Layout = ReturnType<typeof getLayout>;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const HoopShot = forwardRef<HoopShotHandle, HoopShotProps>(function HoopShot(
  { fileName, dragging, onPickRequest, onScore, onMiss, className },
  ref
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<SVGLineElement>(null);
  const [dims, setDims] = useState({ W: 520, H: 440 });
  const [phase, setPhase] = useState<HoopPhase>("empty");
  const [caption, setCaption] = useState<{ text: string; kind: "miss" | "score"; id: number } | null>(null);
  const [swishId, setSwishId] = useState(0);
  const [popId, setPopId] = useState(0);
  const [missCount, setMissCount] = useState(0);

  const L = useRef<Layout>(getLayout(520, 440));
  const phaseRef = useRef<HoopPhase>("empty");
  const misses = useRef(0);
  const sim = useRef({ x: 0, y: 0, vx: 0, vy: 0, rot: 0, t: 0, prevY: 0, scored: false, assist: false, bounces: 0, scoredAt: 0 });
  const raf = useRef(0);
  const pointer = useRef<number | null>(null);
  const cb = useRef({ onScore, onMiss });
  cb.current = { onScore, onMiss };

  const go = (p: HoopPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const placeBall = (x: number, y: number, rot: number) => {
    const s = sim.current;
    s.x = x;
    s.y = y;
    s.rot = rot;
    if (ballRef.current) ballRef.current.style.transform = `translate(${x - R}px, ${y - R}px) rotate(${rot}rad)`;
  };

  // ─── Layout ────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      L.current = getLayout(el.clientWidth, el.clientHeight);
      setDims({ W: el.clientWidth, H: el.clientHeight });
      if (phaseRef.current === "ready") placeBall(L.current.ax, L.current.ay, 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── File → folded paper → ball ────────────────────────────────────────
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    setCaption(null);
    misses.current = 0;
    setMissCount(0);
    const ball = ballRef.current;
    if (!fileName) {
      go("empty");
      return;
    }
    const { W, H, ax, ay } = L.current;
    if (prefersReducedMotion()) {
      placeBall(ax, ay, 0);
      go("ready");
      return;
    }
    go("folding");
    placeBall(W / 2, H / 2, 0);
    const t1 = setTimeout(() => {
      // fly the fresh ball over to the shooting spot
      go("rolling");
      if (ball) ball.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(.3,.7,.3,1)`;
      requestAnimationFrame(() => placeBall(ax, ay, -Math.PI * 2));
    }, FOLD_MS);
    const t2 = setTimeout(() => {
      if (ball) ball.style.transition = "";
      placeBall(ax, ay, 0);
      go("ready");
    }, FOLD_MS + TRAVEL_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (ball) ball.style.transition = "";
    };
  }, [fileName]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // ─── Aiming ────────────────────────────────────────────────────────────
  /** Dotted path of the whole shot, so aiming is basically connect-the-dots. */
  const showDots = (vx: number, vy: number, visible: boolean) => {
    const box = dotsRef.current;
    if (!box) return;
    const { ax, ay } = L.current;
    Array.from(box.children).forEach((el, i) => {
      const t = 0.055 * (i + 1);
      const x = ax + vx * t;
      const y = ay + vy * t + 0.5 * G * t * t;
      const node = el as HTMLElement;
      node.style.transform = `translate(${x - 4}px, ${y - 4}px)`;
      node.style.opacity = visible ? String(0.95 - (i / DOTS) * 0.6) : "0";
    });
  };

  const showBand = (x: number, y: number, visible: boolean) => {
    const b = bandRef.current;
    if (!b) return;
    b.setAttribute("x1", String(L.current.ax));
    b.setAttribute("y1", String(L.current.ay));
    b.setAttribute("x2", String(x));
    b.setAttribute("y2", String(y));
    b.style.opacity = visible ? "1" : "0";
  };

  const pull = (clientX: number, clientY: number) => {
    const rect = stageRef.current!.getBoundingClientRect();
    const { ax, ay } = L.current;
    let dx = clientX - rect.left - ax;
    let dy = clientY - rect.top - ay;
    const len = Math.hypot(dx, dy);
    if (len > MAX_PULL) {
      dx = (dx / len) * MAX_PULL;
      dy = (dy / len) * MAX_PULL;
    }
    return { dx, dy, len: Math.min(len, MAX_PULL) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== "ready") return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointer.current = e.pointerId;
    setCaption(null);
    go("aiming");
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (phaseRef.current !== "aiming" || pointer.current !== e.pointerId) return;
    const { dx, dy, len } = pull(e.clientX, e.clientY);
    const { ax, ay } = L.current;
    placeBall(ax + dx, ay + dy, 0);
    showBand(ax + dx, ay + dy, len > 8);
    showDots(-dx * POWER, -dy * POWER, len > 12);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (phaseRef.current !== "aiming" || pointer.current !== e.pointerId) return;
    pointer.current = null;
    const { dx, dy, len } = pull(e.clientX, e.clientY);
    showDots(0, 0, false);
    showBand(0, 0, false);
    if (len < 12) {
      placeBall(L.current.ax, L.current.ay, 0);
      go("ready");
      return;
    }
    shoot(-dx * POWER, -dy * POWER);
  };

  // ─── Flight ────────────────────────────────────────────────────────────
  const finishMiss = () => {
    misses.current += 1;
    setMissCount(misses.current);
    cb.current.onMiss?.(misses.current);
    setCaption({ text: MISS_LINES[(misses.current - 1) % MISS_LINES.length], kind: "miss", id: Date.now() });
    placeBall(L.current.ax, L.current.ay, 0);
    setPopId((n) => n + 1);
    go("ready");
  };

  const finishScore = () => {
    setSwishId((n) => n + 1);
    setCaption({ text: SCORE_LINES[Math.floor(Math.random() * SCORE_LINES.length)], kind: "score", id: Date.now() });
    go("scored");
  };

  const launch = (vx: number, vy: number, assist: boolean) => {
    const s = sim.current;
    const { ax, ay } = L.current;
    Object.assign(s, { x: ax, y: ay, vx, vy, rot: 0, t: 0, prevY: ay, scored: false, assist, bounces: 0, scoredAt: 0 });
    go("flying");
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      for (let i = 0; i < 4; i++) physics(dt / 4);
      placeBall(s.x, s.y, s.rot);

      if (s.scored && s.t - s.scoredAt > 0.75) {
        cb.current.onScore();
        return;
      }
      const resting = s.y >= L.current.floor - R - 1 && Math.abs(s.vx) < 40 && s.bounces >= 2;
      if (!s.scored && (s.t > 4 || resting)) {
        finishMiss();
        return;
      }
      raf.current = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(frame);
  };

  const physics = (dt: number) => {
    const s = sim.current;
    const l = L.current;
    s.prevY = s.y;

    // Hoop magnet: once the ball is up near the rim and coming down, ease it to the middle.
    if (!s.scored) {
      const near = s.assist ? 260 : l.rimW / 2 + 70;
      const above = s.y < l.rimY + 4 && s.y > l.rimY - (s.assist ? 320 : 170);
      if (above && Math.abs(s.x - l.rimCX) < near && (s.vy > -150 || s.assist)) {
        const pullStrength = s.assist ? 16 : 10;
        s.vx += (l.rimCX - s.x) * pullStrength * dt;
        s.vx *= 1 - 3.2 * dt;
      }
    }

    s.vy += G * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.t += dt;
    s.rot += (s.vx * dt) / R;

    if (!s.assist || s.scored) {
      for (const cx of [l.rimL, l.rimR]) {
        const dx = s.x - cx;
        const dy = s.y - l.rimY;
        const d = Math.hypot(dx, dy);
        const min = R + RIM_KNOB;
        if (d < min && d > 0) {
          const nx = dx / d;
          const ny = dy / d;
          s.x = cx + nx * min;
          s.y = l.rimY + ny * min;
          const vn = s.vx * nx + s.vy * ny;
          if (vn < 0) {
            s.vx -= 1.5 * vn * nx;
            s.vy -= 1.5 * vn * ny;
          }
        }
      }
    }
    // Backboard (bank shots count)
    if (s.x + R > l.boardX && s.x < l.boardX + 12 && s.y > l.boardTop && s.y < l.boardBot && s.vx > 0) {
      s.x = l.boardX - R;
      s.vx = -s.vx * 0.5;
    }

    if (!s.scored && s.vy > 0 && s.prevY < l.rimY && s.y >= l.rimY && s.x > l.rimL && s.x < l.rimR) {
      s.scored = true;
      s.scoredAt = s.t;
      s.vx = (l.rimCX - s.x) * 2; // drop through the middle of the net
      s.vy *= 0.5;
      finishScore();
    }

    if (s.x - R < 0) {
      s.x = R;
      s.vx = Math.abs(s.vx) * 0.6;
    } else if (s.x + R > l.W) {
      s.x = l.W - R;
      s.vx = -Math.abs(s.vx) * 0.6;
    }
    if (s.y + R > l.floor) {
      s.y = l.floor - R;
      if (s.vy > 0) {
        s.vy = Math.abs(s.vy) < 140 ? 0 : -s.vy * 0.5;
        s.vx *= 0.8;
        s.bounces += 1;
      }
    }
  };

  /** Perfect arc from the shooting spot into the rim, taking `T` seconds. */
  const perfectShot = (T: number) => {
    const { ax, ay, rimCX, rimY } = L.current;
    return { vx: (rimCX - ax) / T, vy: (rimY + 2 - ay - 0.5 * G * T * T) / T };
  };

  /**
   * Make it easy: if the throw gets up to rim height and comes down anywhere
   * near the hoop, quietly swap in a perfect arc with the same timing.
   * After one miss, anything that reaches rim height goes in.
   */
  const shoot = (vx: number, vy: number) => {
    const { ax, ay, rimY, rimCX } = L.current;
    const a = 0.5 * G;
    const c = ay - rimY;
    const disc = vy * vy - 4 * a * c;
    if (disc >= 0 && vy < 0) {
      const t = (-vy + Math.sqrt(disc)) / (2 * a); // when it comes back down through rim height
      const off = Math.abs(ax + vx * t - rimCX);
      const tolerance = misses.current >= 1 ? Infinity : Math.max(220, L.current.W * 0.5);
      if (off < tolerance && (vx > 0 || misses.current >= 1)) {
        const p = perfectShot(Math.min(1.15, Math.max(0.6, t)));
        launch(p.vx, p.vy, true);
        return;
      }
    }
    launch(vx, vy, false);
  };

  const autoShoot = useCallback(() => {
    if (phaseRef.current !== "ready") return;
    setCaption(null);
    if (prefersReducedMotion()) {
      finishScore();
      setTimeout(() => cb.current.onScore(), 600);
      return;
    }
    const p = perfectShot(0.85);
    launch(p.vx, p.vy, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({ autoShoot }), [autoShoot]);

  // ─── Render ────────────────────────────────────────────────────────────
  const l = getLayout(dims.W, dims.H);
  const ext = (fileName?.split(".").pop() || "doc").slice(0, 4).toUpperCase();
  const isEmpty = phase === "empty";
  const showCourt = !isEmpty;
  const showBall = phase !== "empty" && phase !== "folding";

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative w-full select-none overflow-hidden rounded-[28px] transition-[box-shadow,background-color] duration-300",
        isEmpty ? "drop-card" : "hoop-stage",
        isEmpty && dragging && "drop-card-active",
        className
      )}
      style={{ height: "clamp(380px, 58vh, 460px)" }}
    >
      {/* 1 ─ Normal drop-in card */}
      {isEmpty && (
        <button
          type="button"
          onClick={onPickRequest}
          className="absolute inset-3 rounded-[22px] border-2 border-dashed border-border hover:border-primary/60 transition-colors grid place-items-center text-center px-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 cursor-pointer"
          aria-label="Pick a document, or drop one here"
        >
          <span className="flex flex-col items-center">
            <span className={cn("grid place-items-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-5 transition-transform duration-300", dragging && "scale-110 -translate-y-1")}>
              <Upload className="w-7 h-7" />
            </span>
            <span className="text-lg md:text-xl font-semibold">{dragging ? "Let go, I got it 🙌" : "Drop your document here"}</span>
            <span className="text-muted-foreground mt-1.5">
              or <span className="text-primary font-medium underline underline-offset-4">browse files</span>
            </span>
            <span className="text-xs text-muted-foreground mt-5">PDF · DOCX · TXT · RTF · HTML · Markdown · CSV</span>
          </span>
        </button>
      )}

      {/* Court fades in once there's a file */}
      <div className={cn("absolute inset-0 transition-opacity duration-500", showCourt ? "opacity-100" : "opacity-0 pointer-events-none")} aria-hidden={!showCourt}>
        <div className="absolute inset-x-0 bottom-0 h-[18px] hoop-floor" />
        <svg className="absolute inset-0 pointer-events-none" width={l.W} height={l.H} aria-hidden>
          <line ref={bandRef} className="hoop-band" strokeWidth="3" strokeLinecap="round" style={{ opacity: 0 }} />
        </svg>

        <div className={cn(phase === "folding" ? "hoop-enter" : "")}>
          <div className="absolute hoop-pole" style={{ left: l.boardX + 4, top: l.boardBot - 4, width: 8, height: l.floor - l.boardBot + 4 }} />
          <div className="absolute rounded-md hoop-board" style={{ left: l.boardX, top: l.boardTop, width: 12, height: l.boardBot - l.boardTop }} />
          <div className="absolute hoop-rim-back rounded-full" style={{ left: l.rimL, top: l.rimY - 5, width: l.rimW, height: 10 }} />
          {/* target glow so it's obvious where to aim */}
          {(phase === "ready" || phase === "aiming") && (
            <div className="absolute rounded-full hoop-target" style={{ left: l.rimL - 10, top: l.rimY - 22, width: l.rimW + 20, height: 44 }} />
          )}
        </div>

        <div ref={dotsRef} aria-hidden>
          {Array.from({ length: DOTS }).map((_, i) => (
            <span key={i} className="absolute left-0 top-0 w-2 h-2 rounded-full hoop-dot" style={{ opacity: 0 }} />
          ))}
        </div>
      </div>

      {/* 2 ─ The paper folds up and crumples */}
      {phase === "folding" && (
        <div className="absolute left-1/2 top-1/2 z-30 paper-stage" aria-hidden>
          <div className="paper-crumple">
            <div className="paper-fold-x">
              <div className="paper-sheet">
                <div className="paper-bottom"><PaperFace ext={ext} name={fileName ?? ""} /></div>
                <div className="paper-flap">
                  <div className="paper-flap-front"><PaperFace ext={ext} name={fileName ?? ""} top /></div>
                  <div className="paper-flap-back" />
                </div>
              </div>
            </div>
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full morph-spark" style={{ ["--a" as string]: `${i * 36}deg` }} />
          ))}
        </div>
      )}

      {/* 3 ─ The paper ball */}
      <div
        ref={ballRef}
        className="absolute left-0 top-0 z-20 will-change-transform"
        style={{ width: R * 2, height: R * 2, visibility: showBall ? "visible" : "hidden" }}
      >
        <button
          type="button"
          tabIndex={phase === "ready" ? 0 : -1}
          aria-label={phase === "ready" ? "Your document ball. Drag back and let go to shoot, or press Enter for a perfect shot" : "Your document ball"}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              autoShoot();
            }
          }}
          className={cn(
            "absolute inset-[-18px] rounded-full touch-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
            phase === "ready" ? "cursor-grab" : phase === "aiming" ? "cursor-grabbing" : "cursor-default"
          )}
        >
          <span key={`ball-${popId}-${showBall}`} className={cn("absolute inset-[18px] block", popId ? "ball-respawn" : "ball-pop")}>
            <PaperBall label={ext} />
          </span>
        </button>
      </div>

      {/* Front rim + net (in front of the ball, so it drops "through") */}
      <div
        className={cn("absolute z-30 pointer-events-none transition-opacity duration-500", showCourt ? "opacity-100" : "opacity-0", phase === "folding" && "hoop-enter")}
        style={{ left: l.rimL - 4, top: l.rimY - 4, width: l.rimW + 8 }}
      >
        <div className="h-[8px] rounded-full hoop-rim" />
        <svg key={swishId} className={cn("block mx-auto origin-top", swishId > 0 && "net-swish")} width={l.rimW} height={56} viewBox="0 0 84 52" preserveAspectRatio="none" aria-hidden>
          <g className="hoop-net" fill="none" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke">
            {[0, 14, 28, 42, 56, 70, 84].map((x, i) => (
              <path key={i} d={`M ${x} 0 L ${14 + (x / 84) * 56} 50`} />
            ))}
            <path d="M 3 12 L 81 12 M 8 26 L 76 26 M 12 40 L 72 40" />
          </g>
        </svg>
      </div>

      {swishId > 0 && (
        <div key={`c-${swishId}`} className="absolute z-40 pointer-events-none" style={{ left: l.rimCX, top: l.rimY }} aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-3 rounded-[2px] confetti-bit"
              style={{
                background: CONFETTI[i % CONFETTI.length],
                ["--dx" as string]: `${Math.cos((i / 24) * Math.PI * 2) * (60 + (i % 4) * 24)}px`,
                ["--dy" as string]: `${Math.sin((i / 24) * Math.PI * 2) * 50 - 50 + (i % 3) * 30}px`,
                ["--r" as string]: `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
                animationDelay: `${(i % 5) * 18}ms`,
              }}
            />
          ))}
        </div>
      )}

      {caption && (
        <div
          key={caption.id}
          role="status"
          className={cn(
            "absolute left-1/2 top-[10%] z-40 -translate-x-1/2 whitespace-nowrap font-hand leading-none hoop-caption",
            caption.kind === "score" ? "text-5xl md:text-6xl text-primary" : "text-3xl text-muted-foreground"
          )}
        >
          {caption.text}
        </div>
      )}

      {phase === "ready" && missCount === 0 && (
        <p className="absolute z-10 font-hand text-xl text-muted-foreground hoop-hint pointer-events-none whitespace-nowrap" style={{ left: Math.max(8, l.ax - 50), top: l.ay + 36 }}>
          ↙ pull back & let go
        </p>
      )}
    </div>
  );
});

/** Crumpled paper ball, with a tiny tag for the file type. */
function PaperBall({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]">
      <defs>
        <radialGradient id="pb-g" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#ece6e1" />
          <stop offset="100%" stopColor="#bdb3ab" />
        </radialGradient>
      </defs>
      <path d="M24 1.5 L33 4 L41 9 L46 18 L46.5 28 L42 38 L34 45 L24 46.5 L13 44 L5.5 37 L1.5 27 L3 16 L9 7.5 L16 3 Z" fill="url(#pb-g)" />
      <g fill="none" stroke="#9c918a" strokeOpacity="0.7" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
        <path d="M9 7.5 L18 17 L16 28 L5.5 37" />
        <path d="M18 17 L30 14 L41 9" />
        <path d="M30 14 L33 26 L46.5 28" />
        <path d="M16 28 L27 34 L33 26" />
        <path d="M27 34 L24 46.5" />
        <path d="M27 34 L42 38" />
        <path d="M24 1.5 L30 14" />
      </g>
      <rect x="14" y="19" width="20" height="9" rx="4.5" fill="#e1663f" />
      <text x="24" y="25.8" textAnchor="middle" fontSize="6" fontWeight="800" fill="#fff" fontFamily="ui-sans-serif, system-ui">
        {label}
      </text>
    </svg>
  );
}

/** One side of the sheet of paper before it folds. */
function PaperFace({ ext, name, top }: { ext: string; name: string; top?: boolean }) {
  return (
    <div className="absolute inset-0 px-4 py-3 flex flex-col gap-1.5">
      {top ? (
        <>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[9px] font-semibold text-neutral-700 truncate">{name}</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-300 w-[90%]" />
          <div className="h-1.5 rounded-full bg-neutral-300 w-[75%]" />
          <div className="h-1.5 rounded-full bg-neutral-300 w-[85%]" />
        </>
      ) : (
        <>
          <div className="h-1.5 rounded-full bg-neutral-300 w-[88%]" />
          <div className="h-1.5 rounded-full bg-neutral-300 w-[70%]" />
          <div className="h-1.5 rounded-full bg-neutral-300 w-[80%]" />
          <span className="mt-auto self-start rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">{ext}</span>
        </>
      )}
    </div>
  );
}
