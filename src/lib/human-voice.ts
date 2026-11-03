// Human-sounding voice (Kokoro, runs free in the browser) — main-thread side.
import type { WorkerIn, WorkerOut } from "./tts.worker";

export const HUMAN_VOICE = { voice: "am_michael", speed: 1.05 };

export type VoiceStatus = "idle" | "loading" | "ready" | "error" | "unsupported";

interface State {
  status: VoiceStatus;
  progress: number;
}

let worker: Worker | null = null;
let state: State = { status: "idle", progress: 0 };
const listeners = new Set<(s: State) => void>();
const pending = new Map<number, { resolve: (b: AudioBuffer) => void; reject: (e: Error) => void }>();
let nextId = 1;
let ctx: AudioContext | null = null;

/** Short fade in/out so clips start and stop without a click. */
export function smoothEdges(audio: Float32Array, sampleRate: number, ms = 12) {
  const n = Math.min(Math.floor((sampleRate * ms) / 1000), Math.floor(audio.length / 2));
  for (let i = 0; i < n; i++) {
    const g = i / n;
    audio[i] *= g;
    audio[audio.length - 1 - i] *= g;
  }
}

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

export function getVoiceState(): State {
  return state;
}

export function subscribeVoice(fn: (s: State) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function canRun(): boolean {
  if (typeof window === "undefined" || typeof Worker === "undefined" || typeof WebAssembly === "undefined") return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return false;
  return true;
}

function getWorker(): Worker | null {
  if (worker) return worker;
  if (!canRun()) {
    setState({ status: "unsupported" });
    return null;
  }
  worker = new Worker(new URL("./tts.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<WorkerOut>) => {
    const msg = e.data;
    switch (msg.type) {
      case "progress":
        setState({ progress: msg.progress });
        break;
      case "ready":
        setState({ status: "ready", progress: 1 });
        break;
      case "error":
        console.warn("Human voice failed to load, using the browser voice:", msg.message);
        setState({ status: "error" });
        break;
      case "audio": {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (!p) break;
        const ac = getAudioContext();
        smoothEdges(msg.audio, msg.sampleRate);
        const buffer = ac.createBuffer(1, msg.audio.length, msg.sampleRate);
        buffer.copyToChannel(msg.audio, 0);
        p.resolve(buffer);
        break;
      }
      case "audio-error": {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        p?.reject(new Error(msg.message));
        break;
      }
    }
  };
  worker.onerror = () => setState({ status: "error" });
  return worker;
}

/** Start downloading the voice in the background (no-op if already loading/ready). */
export function preloadHumanVoice() {
  if (state.status !== "idle") return;
  const w = getWorker();
  if (!w) return;
  setState({ status: "loading" });
  w.postMessage({ type: "load" } satisfies WorkerIn);
}

/** Resolves true once the human voice is ready, false on error or timeout. */
export function waitForHumanVoice(timeoutMs: number): Promise<boolean> {
  if (state.status === "ready") return Promise.resolve(true);
  if (state.status !== "loading") return Promise.resolve(false);
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      unsub();
      resolve(false);
    }, timeoutMs);
    const unsub = subscribeVoice((s) => {
      if (s.status === "ready" || s.status === "error") {
        clearTimeout(t);
        unsub();
        resolve(s.status === "ready");
      }
    });
  });
}

export function synthesize(text: string): Promise<AudioBuffer> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("Human voice unavailable"));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ type: "speak", id, text, ...HUMAN_VOICE } satisfies WorkerIn);
  });
}

export function getAudioContext(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

/** Call from a click/tap/drop handler so the browser lets us play audio later. */
export function unlockAudio() {
  try {
    const ac = getAudioContext();
    if (ac.state === "suspended") void ac.resume();
  } catch {
    /* audio not available */
  }
}
