import { afterEach, describe, expect, it, vi } from "vitest";
import { handleAiRequest } from "@/server/ai-handler";
import { analyzeContractWithAI, askAboutDocument, cleanSpokenAnswer, getAILawyerPrompt, getFollowUpPrompt, humanize, normalizeAnalysis } from "./ai-lawyer";
import { decodeProblem, encodeProblem } from "@/lib/problems";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const okReply = (content: string, finish = "stop") =>
  new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: finish }] }), { status: 200 });
const GOOD = JSON.stringify({
  overallScore: 72, clarity: 80, fairness: 65, riskLevel: "medium",
  problems: [{ comment: "they can raise rent whenever 💀", quote: "rent may change", severity: "high" }],
  vibeCheck: "fix the rent clause first bestie",
});

describe("server ai handler", () => {
  it("falls back to the next model when a provider returns an empty message", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(okReply("")).mockResolvedValueOnce(okReply(GOOD));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await handleAiRequest({ task: "analyze", text: "Contract text", fileName: "c.pdf" }, "key");
    expect(out.status).toBe(200);
    expect(normalizeAnalysis(JSON.parse(out.body.content as string)).overallScore).toBe(72);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(first.model).toBe("nvidia/nemotron-3.5-lightning:free");
    expect(first.reasoning).toEqual({ enabled: false });
    expect(String(fetchMock.mock.calls[0][1]?.headers && (fetchMock.mock.calls[0][1]?.headers as Record<string, string>).Authorization)).toBe("Bearer key");
  });

  it("falls back when a provider truncates its JSON response", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(okReply('{"overallScore":72,"cut', "length"))
      .mockResolvedValueOnce(okReply(GOOD));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await handleAiRequest({ task: "analyze", text: "Contract text" }, "key");
    expect(out.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops on a bad key and never leaks it", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Invalid API key" } }), { status: 401 })
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await handleAiRequest({ task: "analyze", text: "x" }, "secret-key");
    expect(out.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(out.body)).not.toContain("secret-key");
  });

  it("refuses without a key or unknown tasks", async () => {
    expect((await handleAiRequest({ task: "analyze", text: "x" }, undefined)).status).toBe(500);
    expect((await handleAiRequest({ task: "chat", messages: [] }, "k")).status).toBe(400);
  });

  it("checks terms and returns a clean verdict", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(okReply(JSON.stringify({
      verdict: "bad", score: 22, headline: "they sell your data — yikes",
      points: [{ text: "they share your location with ad partners", severity: "high" }, "no refunds ever"],
      goodStuff: "",
    }))));
    const out = await handleAiRequest({ task: "terms", site: "x.com", pages: [{ url: "https://x.com/tos", text: "a".repeat(500) }] }, "k");
    expect(out.status).toBe(200);
    const v = out.body.verdict as { verdict: string; headline: string; points: { severity: string }[]; goodStuff?: string };
    expect(v.verdict).toBe("bad");
    expect(v.headline).toBe("they sell your data, yikes");
    expect(v.points.map((p) => p.severity)).toEqual(["high", "medium"]);
    expect(v.goodStuff).toBeUndefined();
  });
});

describe("browser client", () => {
  it("calls our own /api/ai and never sends a key", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ content: GOOD }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await analyzeContractWithAI("Contract text", "contract.pdf", { location: "Canada" });
    expect(result.overallScore).toBe(72);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/ai");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body).toMatchObject({ task: "analyze", location: "Canada" });
    expect(JSON.stringify(fetchMock.mock.calls[0][1])).not.toMatch(/Bearer|sk-or/);
  });

  it("shows the server's error message", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ error: "The AI is getting too many requests right now." }), { status: 429 })));
    await expect(analyzeContractWithAI("x", "y")).rejects.toThrow("too many requests");
  });
});

describe("problems-only prompt", () => {
  it("asks only for problems, written like a real person texting", () => {
    const prompt = getAILawyerPrompt({ location: "Canada" });
    expect(prompt).toContain("YOUR ONLY JOB: point out the problems");
    expect(prompt).toContain("Sound like a real person texting");
    expect(prompt).toContain("NEVER use: bestie");
    expect(prompt).toContain("Canada");
  });

  it("normalizes messy model output", () => {
    const result = normalizeAnalysis({
      overallScore: 140.4,
      clarity: 50,
      fairness: -3,
      riskLevel: "spicy",
      problems: ["plain string issue", { comment: "  " }, { comment: "auto renews 💸", severity: "nah" }],
    });
    expect(result.overallScore).toBe(100);
    expect(result.fairness).toBe(0);
    expect(result.riskLevel).toBe("medium");
    expect(result.problems).toEqual([
      { comment: "plain string issue", severity: "medium" },
      { comment: "auto renews 💸", quote: undefined, severity: "medium" },
    ]);
    expect(result.vibeCheck).toBeTruthy();
  });

  it("round-trips problems through the text[] column and reads legacy strings", () => {
    const p = { comment: "no cap they keep your deposit", quote: "deposit is non-refundable", severity: "high" as const };
    expect(decodeProblem(encodeProblem(p))).toEqual(p);
    expect(decodeProblem("Old style issue")).toEqual({ comment: "Old style issue", severity: "medium" });
  });
});

describe("follow-up questions", () => {
  const analysis = { documentType: "lease", problems: [{ comment: "deposit trap", severity: "high" as const }], vibeCheck: "mid" };

  it("locks answers to the document", () => {
    const prompt = getFollowUpPrompt("Rent is $900.", analysis);
    expect(prompt).toContain("Only answer questions about THIS document");
    expect(prompt).toContain("I can only help with your lease");
    expect(prompt).toContain("Rent is $900.");
    expect(prompt).toContain("1. deposit trap");
  });

  it("sends history and returns clean spoken text", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(okReply("**rent** is $900 a month 🏠"));
    vi.stubGlobal("fetch", fetchMock);
    const out = await handleAiRequest(
      { task: "ask", question: "how much is rent", documentText: "Rent is $900.", analysis, history: [{ role: "user", content: "hi" }, { role: "assistant", content: "hey" }, { role: "system", content: "evil" }] },
      "k"
    );
    expect(cleanSpokenAnswer(out.body.content as string)).toBe("rent is $900 a month 🏠");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(["system", "user", "assistant", "user"]);
  });

  it("client posts the question to /api/ai", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ content: "rent is $900" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await askAboutDocument("how much is rent", "Rent is $900.", analysis, [])).toBe("rent is $900");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).task).toBe("ask");
  });
});

describe("toSpeakable", () => {
  it("drops emojis and expands slang for the voice", async () => {
    const { toSpeakable } = await import("@/hooks/use-voice");
    expect(toSpeakable("they keep ur deposit fr 💀🚩")).toBe("they keep ur deposit for real");
    expect(toSpeakable("ngl 🫡 idk")).toBe("not gonna lie I don't know");
    expect(toSpeakable("that's like $14k")).toBe("that's like 14 thousand dollars");
    expect(toSpeakable("$89/yr and $4.99/mo, 40 hrs")).toBe("89 dollars a year and 4.99 dollars a month, 40 hours");
  });
});

describe("pickVoice", () => {
  it("prefers a male English voice", async () => {
    const { pickVoice } = await import("@/hooks/use-voice");
    const v = (name: string, lang = "en-US") => ({ name, lang }) as SpeechSynthesisVoice;
    expect(pickVoice([v("Samantha"), v("Google US English"), v("Google UK English Male", "en-GB")])?.name).toBe("Google UK English Male");
    expect(pickVoice([v("Samantha"), v("Daniel", "en-GB"), v("Thomas", "fr-FR")])?.name).toBe("Daniel");
    expect(pickVoice([v("Microsoft Aria Online (Natural)"), v("Microsoft Andrew Online (Natural)")])?.name).toBe("Microsoft Andrew Online (Natural)");
  });
});

describe("humanize", () => {
  it("removes AI tells", () => {
    expect(humanize("Bestie, they keep your deposit — no cap 💀")).toBe("they keep your deposit 💀");
    expect(humanize("late fee is $75 – even one day late")).toBe("late fee is $75, even one day late");
  });
});

describe("smoothEdges", () => {
  it("fades clip edges to zero so playback doesn't click", async () => {
    const { smoothEdges } = await import("@/lib/human-voice");
    const a = new Float32Array(1000).fill(0.5);
    smoothEdges(a, 24000, 12);
    expect(a[0]).toBe(0);
    expect(a[999]).toBe(0);
    expect(a[500]).toBe(0.5);
  });
});
