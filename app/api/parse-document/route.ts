import { NextResponse } from "next/server";
import mammoth from "mammoth";

// Polyfill DOMMatrix for Next.js/Node server environment where pdf.js evaluation checks for it
if (typeof global !== "undefined" && !(global as any).DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {};
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const ext = filename.split(".").pop();

    if (ext === "docx") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      
      return NextResponse.json({ 
        text: result.value,
        messages: result.messages 
      });
    } else if (ext === "pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Dynamic import of modern pdf-parse PDFParse class
      const { PDFParse } = await import("pdf-parse");
      
      // Resolve worker path to valid file:// URL for ESM loader on Windows/Linux environments
      const path = await import("path");
      const { pathToFileURL } = await import("url");
      const workerPath = path.resolve("./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
      const workerUrl = pathToFileURL(workerPath).href;
      
      PDFParse.setWorker(workerUrl);
      
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      
      return NextResponse.json({ 
        text: data.text || ""
      });
    } else {
      return NextResponse.json({ message: "Unsupported file format for parsing" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Document parsing error:", err);
    return NextResponse.json({ message: "Parsing failed", error: err.message }, { status: 500 });
  }
}
