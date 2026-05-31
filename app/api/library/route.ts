import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let approvedAnswers;
    if (search.trim().length > 0) {
      approvedAnswers = await prisma.approvedAnswer.findMany({
        where: {
          OR: [
            { canonicalQuestion: { contains: search } },
            { answerText: { contains: search } },
            { category: { contains: search } },
            { tags: { contains: search } }
          ]
        },
        include: {
          approvedBy: true
        },
        orderBy: { usageCount: "desc" },
        take: 50
      });
    } else {
      approvedAnswers = await prisma.approvedAnswer.findMany({
        include: {
          approvedBy: true
        },
        orderBy: { usageCount: "desc" },
        take: 50
      });
    }

    return NextResponse.json(approvedAnswers);
  } catch (err: any) {
    console.error("GET library error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { canonicalQuestion, answerText, category, tags, approvedById } = await req.json();

    if (!canonicalQuestion || !answerText) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const approved = await prisma.approvedAnswer.create({
      data: {
        canonicalQuestion,
        answerText,
        category: category || "General",
        tags: tags || null,
        approvedById: approvedById || null,
      },
      include: {
        approvedBy: true
      }
    });

    return NextResponse.json(approved, { status: 201 });
  } catch (err: any) {
    console.error("POST library error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
