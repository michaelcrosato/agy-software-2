import { NextResponse } from "next/server";
import mammoth from "mammoth";

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
    } else {
      return NextResponse.json({ message: "Unsupported file format for parsing" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Document parsing error:", err);
    return NextResponse.json({ message: "Parsing failed", error: err.message }, { status: 500 });
  }
}
