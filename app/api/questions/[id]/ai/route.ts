import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performLocalRAG } from "@/lib/rag";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parse tone if present in request body or query string
    let tone = "Concise";
    try {
      // Use clone to avoid locking the request stream in case of errors
      const body = await req.clone().json();
      if (body && body.tone) {
        tone = body.tone;
      }
    } catch (e) {
      const { searchParams } = new URL(req.url);
      tone = searchParams.get("tone") || "Concise";
    }

    // 1. Fetch the question to make sure it exists
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        answerDraft: true,
      },
    });

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    // 2. Perform local RAG on the question text
    const ragResult = await performLocalRAG(question.originalText, tone);

    // 3. Update the question's confidence label and status
    await prisma.question.update({
      where: { id },
      data: {
        confidenceLabel: ragResult.confidence,
        status: ragResult.confidence === "No Source" ? "Needs Source" : "Needs Review",
      },
    });

    // 4. Update or create the answer draft
    let draft = question.answerDraft;
    if (draft) {
      await prisma.answerDraft.update({
        where: { id: draft.id },
        data: { text: ragResult.text },
      });

      // Clear old citations
      await prisma.citation.deleteMany({
        where: { answerDraftId: draft.id },
      });
    } else {
      draft = await prisma.answerDraft.create({
        data: {
          questionId: id,
          text: ragResult.text,
        },
      });
    }

    // 5. Add new citations if present
    for (const cit of ragResult.citations) {
      await prisma.citation.create({
        data: {
          answerDraftId: draft.id,
          sourceChunkId: cit.chunkId,
          quoteExcerpt: cit.excerpt,
        },
      });
    }

    // 6. Return fully updated question with details
    const updatedQuestion = await prisma.question.findUnique({
      where: { id },
      include: {
        assignedUser: true,
        answerDraft: {
          include: {
            citations: {
              include: {
                sourceChunk: {
                  include: {
                    sourceDocument: true,
                  },
                },
              },
            },
          },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(updatedQuestion);
  } catch (err: any) {
    console.error("POST question AI draft error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
