import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, assignedUserId, category, answerText, saveToLibrary } = await req.json();

    // 1. Check if question exists
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        answerDraft: true
      }
    });

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    // 2. Perform updates
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId;
    if (category !== undefined) updateData.category = category;

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: updateData,
      include: {
        assignedUser: true,
        answerDraft: true
      }
    });

    // 3. Update answer draft if provided
    if (answerText !== undefined) {
      if (updatedQuestion.answerDraft) {
        await prisma.answerDraft.update({
          where: { id: updatedQuestion.answerDraft.id },
          data: { text: answerText }
        });
      } else {
        await prisma.answerDraft.create({
          data: {
            questionId: id,
            text: answerText
          }
        });
      }
    }

    // 4. Save to Approved Reusable Answers Library if requested and status is "Approved"
    if (saveToLibrary && status === "Approved") {
      const finalAnswerText = answerText || updatedQuestion.answerDraft?.text || "";
      if (finalAnswerText.trim().length > 0) {
        // Look if it already exists or create new
        const existingApproved = await prisma.approvedAnswer.findFirst({
          where: { canonicalQuestion: question.originalText }
        });

        if (existingApproved) {
          await prisma.approvedAnswer.update({
            where: { id: existingApproved.id },
            data: {
              answerText: finalAnswerText,
              category: updatedQuestion.category,
              lastUsedAt: new Date(),
              usageCount: { increment: 1 }
            }
          });
        } else {
          await prisma.approvedAnswer.create({
            data: {
              canonicalQuestion: question.originalText,
              answerText: finalAnswerText,
              category: updatedQuestion.category,
              lastUsedAt: new Date(),
              usageCount: 1,
              approvedById: updatedQuestion.assignedUserId || null,
            }
          });
        }
      }
    }

    // Return fully updated question with details
    const finalQuestion = await prisma.question.findUnique({
      where: { id },
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
          }
        }
      }
    });

    return NextResponse.json(finalQuestion);
  } catch (err: any) {
    console.error("PUT question error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

// POST endpoint lets users add comments to questions
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { body, userId } = await req.json();

    if (!body || !userId) {
      return NextResponse.json({ message: "Body and userId are required" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        questionId: id,
        userId,
        body
      },
      include: {
        user: true
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err: any) {
    console.error("POST question comment error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
