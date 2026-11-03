import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeContractWithAI, askAboutDocument, getAILawyerPrompt, getFollowUpPrompt, normalizeAnalysis } from "./ai-lawyer";
import { decodeProblem, encodeProblem } from "@/lib/problems";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("analyzeContractWithAI", () => {
  it("falls back to the next model when a provider returns an empty message", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "" }, finish_reason: "stop" }],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    overallScore: 72,
                    clarity: 80,
                    fairness: 65,
                    riskLevel: "medium",
                    problems: [{ comment: "they can raise rent whenever 💀", quote: "rent may change", severity: "high" }],
                    vibeCheck: "fix the rent clause first bestie",
                  }),
                },
              },
            ],
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await analyzeContractWithAI(
      "Contract text",
      "contract.pdf",
      "test-api-key"
    );

    expect(result.overallScore).toBe(72);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstRequest = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(firstRequest).not.toHaveProperty("response_format");
    expect(firstRequest).not.toHaveProperty("reasoning");
  });

  it("falls back when a provider truncates its JSON response", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: '{"overallScore":72,"simpleExplanation":"cut off' },
                finish_reason: "length",
              },
            ],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    overallScore: 72,
                    clarity: 80,
                    fairness: 65,
                    riskLevel: "medium",
                    problems: [{ comment: "they can raise rent whenever 💀", quote: "rent may change", severity: "high" }],
                    vibeCheck: "fix the rent clause first bestie",
                  }),
                },
              },
            ],
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await analyzeContractWithAI(
      "Contract text",
      "contract.pdf",
      "test-api-key"
    );

    expect(result.vibeCheck).toBe("fix the rent clause first bestie");
    expect(result.problems[0].severity).toBe("high");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("preserves the provider's error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: "Invalid API key" } }),
          { status: 401, statusText: "Unauthorized" }
        )
      )
    );

    await expect(
      analyzeContractWithAI(
        "Contract text",
        "contract.pdf",
        "test-api-key",
        undefined,
        "test/provider"
      )
    ).rejects.toThrow("OpenRouter API error: Invalid API key");
  });
});

describe("Gen Z problems-only prompt", () => {
  it("asks only for problems in TikTok-comment style", () => {
    const prompt = getAILawyerPrompt({ location: "Canada" });
    expect(prompt).toContain("ONLY job: find the PROBLEMS");
    expect(prompt).toContain("TikTok comment");
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
    expect(prompt).toContain("that's not in your doc bestie");
    expect(prompt).toContain("Rent is $900.");
    expect(prompt).toContain("1. deposit trap");
  });

  it("sends history and returns clean spoken text", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "**rent** is $900 a month 🏠" } }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askAboutDocument("how much is rent", "Rent is $900.", analysis, [{ role: "user", content: "hi" }, { role: "assistant", content: "hey" }], "k");
    expect(answer).toBe("rent is $900 a month 🏠");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(["system", "user", "assistant", "user"]);
  });
});

describe("toSpeakable", () => {
  it("drops emojis and expands slang for the voice", async () => {
    const { toSpeakable } = await import("@/hooks/use-voice");
    expect(toSpeakable("they keep ur deposit fr 💀🚩")).toBe("they keep ur deposit for real");
    expect(toSpeakable("ngl 🫡 idk")).toBe("not gonna lie I don't know");
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
