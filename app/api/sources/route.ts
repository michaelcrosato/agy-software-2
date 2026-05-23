import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sources = await prisma.sourceDocument.findMany({
      include: {
        _count: {
          select: { chunks: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(sources);
  } catch (err: any) {
    console.error("GET sources error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, fileType, text, tags } = await req.json();
    
    if (!title || !fileType || !text) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 1. Create the source document
    const doc = await prisma.sourceDocument.create({
      data: {
        title,
        fileType,
        processingStatus: "Success",
        approvalStatus: "Approved",
        tags: tags || "General",
      }
    });

    // 2. Simple chunking: split text into paragraphs or blocks
    const rawParagraphs = text.split(/\n\s*\n/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    
    // Insert chunks
    for (let i = 0; i < rawParagraphs.length; i++) {
      await prisma.sourceChunk.create({
        data: {
          sourceDocumentId: doc.id,
          chunkIndex: i,
          pageNumber: Math.floor(i / 2) + 1,
          sectionTitle: "Section " + (i + 1),
          text: rawParagraphs[i],
        }
      });
    }

    const completedDoc = await prisma.sourceDocument.findUnique({
      where: { id: doc.id },
      include: { chunks: true }
    });

    return NextResponse.json(completedDoc, { status: 201 });
  } catch (err: any) {
    console.error("POST sources error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
