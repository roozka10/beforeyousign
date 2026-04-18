import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    console.log(`📄 Loading PDF: ${file.name} (${file.size} bytes)`);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log(`📖 PDF loaded: ${pdf.numPages} pages`);

    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => (typeof item.str === "string" ? item.str : ""))
          .join(" ");
        fullText += pageText + "\n";
      } catch (pageError) {
        console.warn(`⚠️ Could not extract page ${pageNum}, skipping...`);
      }
    }

    const trimmedText = fullText.trim();
    console.log(`✅ Extracted ${trimmedText.length} characters`);

    return trimmedText;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(
      "Failed to extract text from PDF. Please ensure: 1) It's a valid PDF, 2) It contains readable text (not just images), 3) It's not password protected."
    );
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;

  // Handle PDF
  if (fileType === "application/pdf") {
    return extractTextFromPDF(file);
  }

  // Handle plain text
  if (fileType === "text/plain") {
    return file.text();
  }

  // Handle DOCX (basic support - extracts from XML)
  if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDOCX(file);
  }

  throw new Error(
    "Unsupported file type. Please use PDF, DOCX, or TXT files."
  );
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    // For DOCX, we need to unzip and parse XML
    // This is a simplified approach - for production, use mammoth.js
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);

    // Extract text between XML tags (basic approach)
    const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    const extractedText = matches
      .map((match) => match.replace(/<[^>]+>/g, ""))
      .join(" ");

    return extractedText || "Unable to extract text from DOCX file.";
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error(
      "Failed to extract text from DOCX. Try converting to PDF first."
    );
  }
}
