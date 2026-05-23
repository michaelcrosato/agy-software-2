import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performLocalRAG } from "@/lib/rag";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.responseProject.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            assignedUser: true,
            answerDraft: {
              include: {
                citations: {
                  include: {
                    sourceChunk: {
                      include: {
                        sourceDocument: true
                      }
                    }
                  }
                }
              }
            },
            comments: {
              include: {
                user: true
              },
              orderBy: { createdAt: "asc" }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (err: any) {
    console.error("GET project detail error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

// POST endpoint triggers AI drafting for the entire project
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find project questions
    const questions = await prisma.question.findMany({
      where: { projectId: id },
      include: {
        answerDraft: true
      }
    });

    if (questions.length === 0) {
      return NextResponse.json({ message: "No questions found in this project" }, { status: 404 });
    }

    // Trigger local RAG for each question
    for (const q of questions) {
      const ragResult = await performLocalRAG(q.originalText);
      
      // Update question status and confidence
      const updatedQ = await prisma.question.update({
        where: { id: q.id },
        data: {
          confidenceLabel: ragResult.confidence,
          status: ragResult.confidence === "No Source" ? "Needs Source" : "Needs Review",
        }
      });

      // Update or create answer draft
      let draft = q.answerDraft;
      if (draft) {
        await prisma.answerDraft.update({
          where: { id: draft.id },
          data: { text: ragResult.text }
        });
        
        // Clean out old citations
        await prisma.citation.deleteMany({
          where: { answerDraftId: draft.id }
        });
      } else {
        draft = await prisma.answerDraft.create({
          data: {
            questionId: q.id,
            text: ragResult.text
          }
        });
      }

      // Add citations
      for (const cit of ragResult.citations) {
        await prisma.citation.create({
          data: {
            answerDraftId: draft.id,
            sourceChunkId: cit.chunkId,
            quoteExcerpt: cit.excerpt
          }
        });
      }
    }

    // Return the updated project detail
    const project = await prisma.responseProject.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            assignedUser: true,
            answerDraft: {
              include: {
                citations: {
                  include: {
                    sourceChunk: {
                      include: {
                        sourceDocument: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ message: "Bulk RAG drafting complete", project });
  } catch (err: any) {
    console.error("POST project AI RAG error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
