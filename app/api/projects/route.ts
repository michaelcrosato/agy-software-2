import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.responseProject.findMany({
      include: {
        questions: {
          select: {
            id: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(projects);
  } catch (err: any) {
    console.error("GET projects error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, customerName, dueDate, questionnaireText } = await req.json();

    if (!name || !customerName) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 1. Create the project
    const project = await prisma.responseProject.create({
      data: {
        name,
        customerName,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "Processing",
      }
    });

    // 2. Parse questionnaire text if present, or fall back to standard checklist questions
    let rawQuestions: string[] = [];
    if (questionnaireText && questionnaireText.trim().length > 0) {
      // split by lines ending with ? or simple numbering
      rawQuestions = questionnaireText
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 5 && (line.endsWith("?") || /^\d+\.?\s+/.test(line)));
    }

    if (rawQuestions.length === 0) {
      // Fallback/standard security questionnaire questions
      rawQuestions = [
        "Do you support Single Sign-On (SSO)?",
        "Describe your database backup frequency and encryption standards.",
        "Do you offer data hosting in the European Union (EU)?",
        "Is ISO 27001 certification currently held by your organization?",
        "What is your data retention policy for deleted accounts?",
        "Are employee background checks conducted annually?"
      ];
    }

    // Create seed user for assignment if needed
    const defaultUser = await prisma.user.findFirst();

    // 3. Create question and empty answer draft records
    for (let i = 0; i < rawQuestions.length; i++) {
      const category = rawQuestions[i].toLowerCase().includes("sso") || rawQuestions[i].toLowerCase().includes("background") 
        ? "Security" 
        : rawQuestions[i].toLowerCase().includes("backup") || rawQuestions[i].toLowerCase().includes("retention")
        ? "Infrastructure"
        : "Compliance";

      const question = await prisma.question.create({
        data: {
          projectId: project.id,
          originalText: rawQuestions[i],
          category,
          answerType: "Short Text",
          sourceLocation: `Row ${i + 1}`,
          status: "Needs Review",
          confidenceLabel: "Low",
          assignedUserId: defaultUser?.id || null,
        }
      });

      // Create initial empty draft
      await prisma.answerDraft.create({
        data: {
          questionId: question.id,
          text: "",
        }
      });
    }

    // Update project status to "In Review"
    const updatedProject = await prisma.responseProject.update({
      where: { id: project.id },
      data: { status: "In Review" },
      include: {
        questions: {
          include: {
            answerDraft: true
          }
        }
      }
    });

    return NextResponse.json(updatedProject, { status: 201 });
  } catch (err: any) {
    console.error("POST projects error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
