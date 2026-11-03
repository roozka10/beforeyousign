import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

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
}

export function useSpeaker() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice>();
  const runIdRef = useRef(0);
  /** 0..1, bumped on every spoken word. The orb reads this every frame. */
  const energyRef = useRef(0);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      voiceRef.current = pickVoice(window.speechSynthesis.getVoices());
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    runIdRef.current++;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
    energyRef.current = 0;
  }, [supported]);

  const speak = useCallback(
    (lines: string[], { onLine }: SpeakOptions = {}): Promise<void> => {
      if (!supported || muted) {
        onLine?.(-1);
        return Promise.resolve();
      }
      window.speechSynthesis.cancel();
      const runId = ++runIdRef.current;
      setSpeaking(true);

      return new Promise((resolve) => {
        const finish = () => {
          if (runId === runIdRef.current) {
            setSpeaking(false);
            energyRef.current = 0;
          }
          onLine?.(-1);
          resolve();
        };

        const playLine = (i: number) => {
          if (runId !== runIdRef.current) return finish();
          if (i >= lines.length) return finish();
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
      });
    },
    [supported, muted]
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) stop();
      return !m;
    });
  }, [stop]);

  return { supported, speaking, muted, toggleMute, speak, stop, energyRef };
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
