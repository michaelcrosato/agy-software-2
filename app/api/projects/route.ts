import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseOptionalIndex(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function coerceJsonArray(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return null;

    return JSON.stringify(parsed.map(cell => String(cell ?? "")));
  } catch {
    return null;
  }
}

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
    const { name, customerName, dueDate, questionnaireText, questions, originalHeadersJson, mappedAnswerColIdx } = await req.json();
    const parsedAnswerColIdx = parseOptionalIndex(mappedAnswerColIdx);

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
        originalHeadersJson: coerceJsonArray(originalHeadersJson),
        mappedAnswerColIdx: parsedAnswerColIdx,
      }
    });

    // 2. Parse questionnaire text if present, or structure the input questions
    interface InputQuestion {
      text: string;
      category?: string;
      sourceLocation?: string;
      originalRowJson?: string;
      rowIndex?: number;
    }

    let parsedQuestions: InputQuestion[] = [];

    if (questions && Array.isArray(questions) && questions.length > 0) {
      parsedQuestions = questions.map((q: Partial<{text: string; category: string; sourceLocation: string; originalRowJson: string; rowIndex: number}>) => ({
        text: String(q.text || "").trim(),
        category: String(q.category || "General").trim(),
        sourceLocation: String(q.sourceLocation || "").trim(),
        originalRowJson: coerceJsonArray(q.originalRowJson) || undefined,
        rowIndex: parseOptionalIndex(q.rowIndex) ?? undefined
      }));
    } else if (questionnaireText && questionnaireText.trim().length > 0) {
      const rawLines = questionnaireText
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 5 && (line.endsWith("?") || /^\d+\.?\s+/.test(line)));
      
      parsedQuestions = rawLines.map((text: string, i: number) => {
        const category = text.toLowerCase().includes("sso") || text.toLowerCase().includes("background") 
          ? "Security" 
          : text.toLowerCase().includes("backup") || text.toLowerCase().includes("retention")
          ? "Infrastructure"
          : "Compliance";
        return {
          text,
          category,
          sourceLocation: `Row ${i + 1}`,
          rowIndex: i
        };
      });
    }

    if (parsedQuestions.length === 0) {
      // Fallback/standard security questionnaire questions
      const fallbacks = [
        "Do you support Single Sign-On (SSO)?",
        "Describe your database backup frequency and encryption standards.",
        "Do you offer data hosting in the European Union (EU)?",
        "Is ISO 27001 certification currently held by your organization?",
        "What is your data retention policy for deleted accounts?",
        "Are employee background checks conducted annually?"
      ];
      parsedQuestions = fallbacks.map((text, i) => {
        const category = text.toLowerCase().includes("sso") || text.toLowerCase().includes("background") 
          ? "Security" 
          : text.toLowerCase().includes("backup") || text.toLowerCase().includes("retention")
          ? "Infrastructure"
          : "Compliance";
        return {
          text,
          category,
          sourceLocation: `Row ${i + 1}`,
          rowIndex: i
        };
      });
    }

    // Create seed user for assignment if needed
    const defaultUser = await prisma.user.findFirst();

    // 3. Create question and empty answer draft records
    const questionsData = parsedQuestions.map((qData, i) => ({
      projectId: project.id,
      originalText: qData.text,
      category: qData.category || "General",
      answerType: "Short Text",
      sourceLocation: qData.sourceLocation || `Row ${i + 1}`,
      status: "Needs Review",
      confidenceLabel: "Low",
      assignedUserId: defaultUser?.id || null,
      originalRowJson: qData.originalRowJson || null,
      rowIndex: qData.rowIndex !== undefined ? qData.rowIndex : i,
    }));

    if (questionsData.length > 0) {
      await prisma.question.createMany({
        data: questionsData
      });

      const createdQuestions = await prisma.question.findMany({
        where: { projectId: project.id },
        select: { id: true }
      });

      const draftsData = createdQuestions.map(q => ({
        questionId: q.id,
        text: "",
      }));

      if (draftsData.length > 0) {
        await prisma.answerDraft.createMany({
          data: draftsData
        });
      }
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
  } catch (err: unknown) {
    console.error("POST projects error:", err);
    return NextResponse.json({ message: "Server error", error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
