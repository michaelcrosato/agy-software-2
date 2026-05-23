import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    // 1. Fetch project with questions, drafts, assignee, and citations
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
          },
          orderBy: { sourceLocation: "asc" }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const safeFileName = project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    // 2. Export based on format
    if (format === "csv") {
      // Create CSV content
      const headers = ["Question Location", "Question Text", "Category", "Status", "RAG Confidence", "Assignee", "Drafted Answer"];
      
      const rows = project.questions.map(q => {
        const location = q.sourceLocation || "";
        const text = q.originalText.replace(/"/g, '""');
        const cat = q.category;
        const status = q.status;
        const confidence = q.confidenceLabel;
        const assignee = q.assignedUser?.name || "Unassigned";
        const answer = (q.answerDraft?.text || "").replace(/"/g, '""');

        return `"${location}","${text}","${cat}","${status}","${confidence}","${assignee}","${answer}"`;
      });

      const csvContent = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeFileName}_export.csv"`
        }
      });
    }

    if (format === "markdown") {
      // Create markdown content
      let md = `# AnswerFlow RFP Response Export\n\n`;
      md += `**Project Name:** ${project.name}\n`;
      md += `**Customer:** ${project.customerName}\n`;
      md += `**Status:** ${project.status}\n`;
      md += `**Exported At:** ${new Date().toLocaleString()}\n\n`;
      md += `---\n\n`;

      // Group questions by category
      const categories = ["Security", "Infrastructure", "Compliance", "General"];
      for (const cat of categories) {
        const catQuestions = project.questions.filter(q => q.category === cat);
        if (catQuestions.length === 0) continue;

        md += `## Section: ${cat}\n\n`;

        for (const q of catQuestions) {
          md += `### ${q.sourceLocation ? `${q.sourceLocation}: ` : ""}${q.originalText}\n`;
          md += `- **Status:** \`${q.status}\`\n`;
          md += `- **Confidence:** \`${q.confidenceLabel} RAG\`\n`;
          md += `- **Assignee:** ${q.assignedUser?.name || "Unassigned"}\n\n`;
          
          md += `**Response:**\n`;
          if (q.answerDraft?.text) {
            md += `${q.answerDraft.text}\n\n`;
          } else {
            md += `*No response drafted.*\n\n`;
          }

          if (q.answerDraft?.citations && q.answerDraft.citations.length > 0) {
            md += `**Cited Grounding Sources:**\n`;
            for (const cit of q.answerDraft.citations) {
              md += `- [${cit.sourceChunk.sourceDocument.title}] (Pg ${cit.sourceChunk.pageNumber || 1}): *"${cit.quoteExcerpt}"*\n`;
            }
            md += `\n`;
          }
          md += `---\n\n`;
        }
      }

      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeFileName}_export.md"`
        }
      });
    }

    if (format === "json") {
      return new NextResponse(JSON.stringify(project, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeFileName}_export.json"`
        }
      });
    }

    return NextResponse.json({ message: "Unsupported export format" }, { status: 400 });
  } catch (err: any) {
    console.error("Export project error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
