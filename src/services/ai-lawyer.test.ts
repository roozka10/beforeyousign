import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeContractWithAI } from "./ai-lawyer";

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
                    keyIssues: ["Issue one", "Issue two", "Issue three"],
                    simpleExplanation: "Review these terms before signing.",
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
                    keyIssues: ["Issue one", "Issue two", "Issue three"],
                    simpleExplanation: "Review these terms before signing.",
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

    expect(result.simpleExplanation).toBe("Review these terms before signing.");
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
