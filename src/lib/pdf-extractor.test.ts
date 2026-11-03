// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("pdfjs-dist", () => ({ GlobalWorkerOptions: {} }));
vi.mock("pdfjs-dist/build/pdf.worker.min?url", () => ({ default: "" }));

const { extractTextFromFile, stripRtf } = await import("./pdf-extractor");

describe("extractTextFromFile", () => {
  it("unzips real DOCX files", async () => {
    const bytes = readFileSync(new URL("./__fixtures__/sample.docx", import.meta.url));
    const file = new File([bytes], "lease.docx");
    const text = await extractTextFromFile(file);
    expect(text).toBe("Tenant pays & agrees\nRent may change anytime.");
  });

  it("reads markdown even when the browser gives no MIME type", async () => {
    const file = new File(["# Terms\nYou owe us forever"], "terms.md", { type: "" });
    expect(await extractTextFromFile(file)).toContain("You owe us forever");
  });

  it("strips RTF control words", () => {
    expect(stripRtf("{\\rtf1\\ansi {\\b Late fee} is $500\\par}")).toBe("Late fee is $500");
  });

  it("rejects images with a friendly message", async () => {
    const file = new File(["x"], "pic.png", { type: "image/png" });
    await expect(extractTextFromFile(file)).rejects.toThrow(/Pics aren't supported/);
  });
});
