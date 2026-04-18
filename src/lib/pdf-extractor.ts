import * as pdfjsLib from "pdfjs-dist";

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF. The file may be corrupted or not a valid PDF.");
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
