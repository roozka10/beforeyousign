import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  getAudioContext,
  getVoiceState,
  subscribeVoice,
  synthesize,
  waitForHumanVoice,
} from "@/lib/human-voice";

/**
 * Free voice, built into the browser (Web Speech API). No API key, no cost.
 * - useSpeaker: text → speech, with a live "energy" ref the orb can pulse to.
 * - useListener: speech → text for asking questions with the mic.
 */

// Emojis sound weird read aloud ("skull", "red flag") — strip them for speech only.
const EMOJI_RE = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|\u200d|\uFE0F/gu;

export function toSpeakable(text: string): string {
  return text
    .replace(EMOJI_RE, "")
    // Money and units, so "$14k/yr" sounds like a person saying it
    .replace(/\$(\d[\d,]*(?:\.\d+)?)\s*k\b/gi, "$1 thousand dollars")
    .replace(/\$(\d[\d,]*(?:\.\d+)?)\s*m\b/gi, "$1 million dollars")
    .replace(/\$(\d[\d,]*(?:\.\d+)?)/g, "$1 dollars")
    .replace(/\s*\/\s*(yr|year)\b/gi, " a year")
    .replace(/\s*\/\s*(mo|month)\b/gi, " a month")
    .replace(/\s*\/\s*(wk|week)\b/gi, " a week")
    .replace(/\s*\/\s*(hr|hour)\b/gi, " an hour")
    .replace(/\bhrs\b/gi, "hours")
    .replace(/\bw\/\s?/gi, "with ")
    .replace(/\bfr\b/gi, "for real")
    .replace(/\bngl\b/gi, "not gonna lie")
    .replace(/\bidk\b/gi, "I don't know")
    .replace(/\btbh\b/gi, "to be honest")
    .replace(/\s+/g, " ")
    .trim();
}

// Male English voices across Chrome, Edge, Safari/macOS, Windows and Android — best first.
const MALE_VOICES = [
  /Microsoft (Andrew|Brian|Guy|Christopher|Eric|Roger|Steffan|Davis|Ryan).*Natural/i,
  /Google UK English Male/i,
  /^(Evan|Nathan|Aaron|Tom|Reed|Daniel|Alex|Oliver|Arthur|Gordon|Lee|Rishi)\b/i,
  /Microsoft (David|Mark|George|James|Richard)/i,
  /\bmale\b/i,
];

const FEMALE_HINT = /female|samantha|victoria|karen|moira|tessa|fiona|zira|susan|hazel|aria|jenny|ava|allison|serena|kate/i;

export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  for (const re of MALE_VOICES) {
    const matches = english.filter((v) => re.test(v.name) && !/female/i.test(v.name));
    // Prefer higher-quality variants when several match.
    const hit = matches.find((v) => /natural|enhanced|premium/i.test(v.name)) ?? matches[0];
    if (hit) return hit;
  }
  return english.find((v) => !FEMALE_HINT.test(v.name)) ?? english[0] ?? voices[0];
}

export interface SpeakOptions {
  /** Called when line i starts being spoken (-1 when finished or stopped). */
  onLine?: (index: number) => void;
  /** If the human voice is still downloading, wait up to this long before falling back. */
  waitForHumanMs?: number;
}

export function useSpeaker() {
  const browserVoice = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voiceState, setVoiceState] = useState(getVoiceState);
  const supported = browserVoice || voiceState.status === "ready";
  const [speaking, setSpeaking] = useState(false);
  /** True between asking to speak and the first sound (e.g. voice still loading). */
  const [warming, setWarming] = useState(false);
  const [muted, setMuted] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice>();
  const runIdRef = useRef(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  /** 0..1 loudness of what's being said right now. The orb reads this every frame. */
  const energyRef = useRef(0);

  useEffect(() => subscribeVoice(setVoiceState), []);

  useEffect(() => {
    if (!browserVoice) return;
    const load = () => {
      voiceRef.current = pickVoice(window.speechSynthesis.getVoices());
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, [browserVoice]);

  const stopAudio = useCallback(() => {
    if (browserVoice) window.speechSynthesis.cancel();
    try {
      sourceRef.current?.stop();
    } catch {
      /* already stopped */
    }
    sourceRef.current = null;
  }, [browserVoice]);

  const stop = useCallback(() => {
    runIdRef.current++;
    stopAudio();
    setSpeaking(false);
    setWarming(false);
    energyRef.current = 0;
  }, [stopAudio]);

  useEffect(() => stop, [stop]);

  /** Human voice: generate every line in the worker, play them back-to-back. */
  const speakHuman = useCallback(
    async (lines: string[], runId: number, onLine?: (i: number) => void): Promise<boolean> => {
      const ac = getAudioContext();
      if (ac.state !== "running") {
        await Promise.race([ac.resume().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
        if ((ac.state as AudioContextState) !== "running") return false; // browser blocked audio — use the fallback
      }

      const texts = lines.map(toSpeakable);
      // Queue all lines now; the worker renders them in order while earlier ones play.
      const buffers = texts.map((t) => (t ? synthesize(t).catch(() => null) : Promise.resolve(null)));

      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      const out = ac.createGain();
      out.gain.value = 0.9; // a little headroom so loud syllables never clip
      analyser.connect(out);
      out.connect(ac.destination);
      const samples = new Float32Array(analyser.fftSize);
      let raf = 0;
      const meter = () => {
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (let k = 0; k < samples.length; k++) sum += samples[k] * samples[k];
        const rms = Math.sqrt(sum / samples.length);
        energyRef.current = Math.min(1, rms * 7);
        raf = requestAnimationFrame(meter);
      };
      raf = requestAnimationFrame(meter);

      try {
        for (let i = 0; i < lines.length; i++) {
          const buffer = await buffers[i];
          if (runId !== runIdRef.current) return true;
          if (!buffer) continue;
          const src = ac.createBufferSource();
          src.buffer = buffer;
          src.connect(analyser);
          sourceRef.current = src;
          onLine?.(i);
          await new Promise<void>((resolve) => {
            src.onended = () => resolve();
            src.start();
          });
          if (runId !== runIdRef.current) return true;
          // Tiny natural pause between thoughts
          await new Promise((r) => setTimeout(r, 220));
        }
        return true;
      } finally {
        cancelAnimationFrame(raf);
        analyser.disconnect();
        out.disconnect();
      }
    },
    []
  );

  /** Browser voice fallback (robotic, but always there). */
  const speakBrowser = useCallback(
    (lines: string[], runId: number, onLine?: (i: number) => void): Promise<void> =>
      new Promise((resolve) => {
        if (!browserVoice) return resolve();
        const playLine = (i: number) => {
          if (runId !== runIdRef.current || i >= lines.length) return resolve();
          const text = toSpeakable(lines[i]);
          if (!text) return playLine(i + 1);
          const u = new SpeechSynthesisUtterance(text);
          if (voiceRef.current) u.voice = voiceRef.current;
          u.rate = 1.05;
          u.pitch = 0.95;
          u.onstart = () => {
            energyRef.current = 1;
            onLine?.(i);
          };
          u.onboundary = () => {
            energyRef.current = 1;
          };
          u.onend = () => playLine(i + 1);
          u.onerror = () => playLine(i + 1);
          window.speechSynthesis.speak(u);
        };
        playLine(0);
      }),
    [browserVoice]
  );

  const speak = useCallback(
    async (lines: string[], { onLine, waitForHumanMs = 0 }: SpeakOptions = {}): Promise<void> => {
      stopAudio();
      const runId = ++runIdRef.current;
      if (muted || !lines.length) {
        onLine?.(-1);
        return;
      }
      setWarming(true);
      const lineStarted = (i: number) => {
        if (runId !== runIdRef.current) return;
        setWarming(false);
        setSpeaking(true);
        onLine?.(i);
      };
      try {
        const human = await waitForHumanVoice(waitForHumanMs);
        if (runId !== runIdRef.current) return;
        const done = human && (await speakHuman(lines, runId, lineStarted));
        if (!done && runId === runIdRef.current) await speakBrowser(lines, runId, lineStarted);
      } finally {
        if (runId === runIdRef.current) {
          setWarming(false);
          setSpeaking(false);
          energyRef.current = 0;
          sourceRef.current = null;
        }
        onLine?.(-1);
      }
    },
    [muted, speakBrowser, speakHuman, stopAudio]
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) stop();
      return !m;
    });
  }, [stop]);

  return {
    supported,
    speaking,
    warming,
    muted,
    toggleMute,
    speak,
    stop,
    energyRef,
    /** Human voice download state, for a small "getting ready" hint. */
    voiceStatus: voiceState.status,
    voiceProgress: voiceState.progress,
  };
}

// ─── Speech recognition (mic → text) ─────────────────────────────────────────

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

type RecognitionCtor = new () => RecognitionLike;

function getRecognition(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useListener(onFinal: (text: string) => void) {
  const Ctor = getRecognition();
  const supported = Boolean(Ctor);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<RecognitionLike | null>(null);
  const onFinalRef: MutableRefObject<typeof onFinal> = useRef(onFinal);
  onFinalRef.current = onFinal;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!Ctor) return;
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";

    rec.onresult = (e) => {
      let live = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(finalText + live);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      setInterim("");
      if (finalText.trim()) onFinalRef.current(finalText.trim());
    };

    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [Ctor]);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, interim, start, stop };
}
