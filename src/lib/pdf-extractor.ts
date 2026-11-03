import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
          .join(" ");
        fullText += pageText + "\n";
      } catch (pageError) {
        console.warn(`⚠️ Could not extract page ${pageNum}, skipping...`);
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(
      "Failed to extract text from PDF. Please ensure: 1) It's a valid PDF, 2) It contains readable text (not just images), 3) It's not password protected."
    );
  }
}

const TEXT_EXTENSIONS = ["txt", "md", "markdown", "csv", "tsv", "json", "xml", "log", "eml", "yaml", "yml"];
const HTML_EXTENSIONS = ["html", "htm"];

/** Every file type the drop zone accepts. */
export const ACCEPTED_FILE_TYPES = [
  ".pdf",
  ".docx",
  ".rtf",
  ...HTML_EXTENSIONS.map((e) => `.${e}`),
  ...TEXT_EXTENSIONS.map((e) => `.${e}`),
].join(",");

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = extensionOf(file.name);
  const type = file.type;

  if (type === "application/pdf" || ext === "pdf") {
    return extractTextFromPDF(file);
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    return extractTextFromDOCX(file);
  }

  if (ext === "rtf" || type === "application/rtf" || type === "text/rtf") {
    return stripRtf(await file.text());
  }

  if (HTML_EXTENSIONS.includes(ext) || type === "text/html") {
    return htmlToText(await file.text());
  }

  if (TEXT_EXTENSIONS.includes(ext) || type.startsWith("text/") || type === "application/json") {
    return file.text();
  }

  if (type.startsWith("image/")) {
    throw new Error(
      "Pics aren't supported yet — export it as a PDF or paste the text into a .txt file."
    );
  }

  throw new Error(
    "Can't read that file type. Try PDF, DOCX, TXT, RTF, HTML, CSV, or Markdown."
  );
}

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript").forEach((el) => el.remove());
  return (doc.body?.textContent ?? "").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

export function stripRtf(rtf: string): string {
  return rtf
    .replace(/\\par[d]?/g, "\n")
    .replace(/\{\\\*[^{}]*\}/g, "")
    .replace(/\\'[0-9a-f]{2}/gi, "")
    .replace(/\\[a-z]+-?\d* ?/gi, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * DOCX is a ZIP archive; the text lives in word/document.xml.
 * Reads the ZIP central directory and inflates that one entry with the
 * browser's built-in DecompressionStream — no extra dependency.
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const xml = await readZipEntry(buf, "word/document.xml");
    if (!xml) throw new Error("word/document.xml not found");

    const text = xml
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:br\/>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) throw new Error("empty document");
    return text;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error("Couldn't read that Word file. Try saving it as a PDF first.");
  }
}

async function readZipEntry(buf: Uint8Array, wanted: string): Promise<string | null> {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  // Find End Of Central Directory record (signature 0x06054b50), scanning backwards.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const entries = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();

  for (let n = 0; n < entries; n++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) return null;
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = decoder.decode(buf.subarray(ptr + 46, ptr + 46 + nameLen));

    if (name === wanted) {
      const lNameLen = view.getUint16(localOffset + 26, true);
      const lExtraLen = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + compSize);

      if (method === 0) return decoder.decode(data);
      if (method === 8) {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        return await new Response(stream).text();
      }
      return null;
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}
