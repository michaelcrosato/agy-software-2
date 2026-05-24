import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const SENSITIVE_CATEGORIES = new Set([
  "security certifications",
  "security",
  "compliance",
  "insurance",
  "legal",
  "data residency",
  "subprocessors",
  "breach notification",
  "financial",
  "references"
]);

function normalizeCategory(category: string) {
  return category.trim().toLowerCase();
}

function parseStringArray(value: string): string[] {
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array");
  }

  return parsed.map(cell => String(cell ?? ""));
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const allowUnapprovedSensitive = searchParams.get("allowUnapprovedSensitive") === "true";

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

    const getProcessedAnswer = (q: typeof project.questions[0]) => {
      const draftText = q.answerDraft?.text || "";
      const isSensitive = SENSITIVE_CATEGORIES.has(normalizeCategory(q.category));
      const isApproved = q.status === "Approved";

      if (isSensitive && !isApproved) {
        if (allowUnapprovedSensitive) {
          return `[UNAPPROVED SENSITIVE CLAIM: USE WITH CAUTION] ${draftText}`.trim();
        }
        return "[BLOCKED: Requires human approval before export]";
      }
      return draftText;
    };

    // 2. Determine spreadsheet structure (original-format vs flat fallback)
    const hasOriginalFormat = !!project.originalHeadersJson && project.mappedAnswerColIdx !== null;
    let exportHeaders: string[] = [];
    let exportRows: string[][] = [];

    if (hasOriginalFormat) {
      try {
        exportHeaders = parseStringArray(project.originalHeadersJson!);
        const sortedQuestions = [...project.questions].sort((a, b) => (a.rowIndex ?? 0) - (b.rowIndex ?? 0));

        exportRows = sortedQuestions.map(q => {
          if (q.originalRowJson) {
            const row = parseStringArray(q.originalRowJson);
            const targetIdx = project.mappedAnswerColIdx!;
            while (row.length <= targetIdx) {
              row.push("");
            }
            row[targetIdx] = getProcessedAnswer(q);
            return row;
          } else {
            const row = Array(exportHeaders.length).fill("");
            row[0] = q.sourceLocation || "";
            row[1] = q.originalText;
            const targetIdx = project.mappedAnswerColIdx!;
            while (row.length <= targetIdx) {
              row.push("");
            }
            row[targetIdx] = getProcessedAnswer(q);
            return row;
          }
        });
      } catch (err) {
        console.error("Failed to reconstruct original format, falling back to flat sheet", err);
      }
    }

    if (exportHeaders.length === 0) {
      exportHeaders = ["Question Location", "Question Text", "Category", "Status", "RAG Confidence", "Assignee", "Drafted Answer"];
      exportRows = project.questions.map(q => [
        q.sourceLocation || "",
        q.originalText,
        q.category,
        q.status,
        q.confidenceLabel,
        q.assignedUser?.name || "Unassigned",
        getProcessedAnswer(q)
      ]);
    }

    // 3. Export based on format
    if (format === "csv") {
      const csvRows = exportRows.map(row => {
        return row.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",");
      });

      const csvContent = [exportHeaders.map(h => `"${String(h || "").replace(/"/g, '""')}"`).join(","), ...csvRows].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeFileName}_export.csv"`
        }
      });
    }

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);

      // Set premium auto-fitting column widths
      const colWidths = exportHeaders.map((h, i) => {
        let maxLen = h.length;
        exportRows.forEach(row => {
          const cellVal = String(row[i] || "");
          if (cellVal.length > maxLen) {
            maxLen = cellVal.length;
          }
        });
        return { wch: Math.min(60, maxLen + 2) };
      });
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "RFP Response");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${safeFileName}_export.xlsx"`
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
          const processedAnswer = getProcessedAnswer(q);
          if (processedAnswer) {
            md += `${processedAnswer}\n\n`;
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
      const processedProject = {
        ...project,
        questions: project.questions.map(q => {
          const processedDraft = q.answerDraft ? {
            ...q.answerDraft,
            text: getProcessedAnswer(q)
          } : null;
          return {
            ...q,
            answerDraft: processedDraft
          };
        })
      };
      return new NextResponse(JSON.stringify(processedProject, null, 2), {
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
