/// <reference lib="webworker" />
// Runs the Kokoro neural voice off the main thread so the orb never stutters.
// The model downloads once from Hugging Face (~310 MB on GPU, ~90 MB on CPU) and is cached by the browser.
import { KokoroTTS } from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

export type WorkerIn =
  | { type: "load" }
  | { type: "speak"; id: number; text: string; voice: string; speed: number };

export type WorkerOut =
  | { type: "progress"; progress: number }
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "audio"; id: number; audio: Float32Array; sampleRate: number }
  | { type: "audio-error"; id: number; message: string };

let ttsPromise: Promise<KokoroTTS> | null = null;
const fileProgress = new Map<string, { loaded: number; total: number }>();

function post(msg: WorkerOut, transfer?: Transferable[]) {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, transfer ?? []);
}

type Backend = { device: "webgpu" | "wasm"; dtype: "fp32" | "q8" };

/**
 * GPU needs full precision (fp32): fp16 sounds buzzy/robotic. It's ~3-4x faster than real time.
 * Without a GPU, q8 on the CPU keeps the same voice quality, just slower.
 */
async function pickBackend(): Promise<Backend> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<object | null> } }).gpu;
    if (await gpu?.requestAdapter()) return { device: "webgpu", dtype: "fp32" };
  } catch {
    /* no WebGPU */
  }
  return { device: "wasm", dtype: "q8" };
}

function onProgress(p: { status: string; file?: string; loaded?: number; total?: number }) {
  if (p.status !== "progress" || !p.file || !p.total) return;
  fileProgress.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
  let loaded = 0;
  let total = 0;
  fileProgress.forEach((f) => {
    loaded += f.loaded;
    total += f.total;
  });
  post({ type: "progress", progress: total ? loaded / total : 0 });
}

async function create(): Promise<KokoroTTS> {
  const backend = await pickBackend();
  try {
    const tts = await KokoroTTS.from_pretrained(MODEL_ID, { ...backend, progress_callback: onProgress });
    // Smoke test: some GPUs load fine but produce broken audio.
    if (backend.device === "webgpu") {
      const probe = await tts.generate("hi.", { voice: "am_michael" });
      const a = probe.audio as Float32Array;
      if (!a.length || !Number.isFinite(a[Math.floor(a.length / 2)])) throw new Error("bad GPU output");
    }
    return tts;
  } catch (err) {
    if (backend.device === "wasm") throw err;
    console.warn("WebGPU voice failed, falling back to WASM", err);
    fileProgress.clear();
    return KokoroTTS.from_pretrained(MODEL_ID, { device: "wasm", dtype: "q8", progress_callback: onProgress });
  }
}

function load(): Promise<KokoroTTS> {
  if (!ttsPromise) {
    ttsPromise = create().then(
      (tts) => {
        post({ type: "ready" });
        return tts;
      },
      (err) => {
        ttsPromise = null;
        post({ type: "error", message: err instanceof Error ? err.message : String(err) });
        throw err;
      }
    );
  }
  return ttsPromise;
}

// Requests are handled strictly in order, so lines come back in the order they were asked.
let queue: Promise<unknown> = Promise.resolve();

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  const msg = e.data;
  if (msg.type === "load") {
    load().catch(() => {});
    return;
  }
  if (msg.type === "speak") {
    queue = queue.then(async () => {
      try {
        const tts = await load();
        const out = await tts.generate(msg.text, { voice: msg.voice as "am_michael", speed: msg.speed });
        const audio = out.audio as Float32Array;
        post({ type: "audio", id: msg.id, audio, sampleRate: out.sampling_rate }, [audio.buffer]);
      } catch (err) {
        post({ type: "audio-error", id: msg.id, message: err instanceof Error ? err.message : String(err) });
      }
    });
  }
};
