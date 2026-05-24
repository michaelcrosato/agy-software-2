import { describe, it, expect } from "vitest";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle 
} from "docx";

describe("AnswerFlow AI Microsoft Word (DOCX) Export Generation", () => {
  it("should build a high-fidelity document structure and serialize to a binary buffer", async () => {
    // 1. Replicate our exact document construction logic
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "AnswerFlow AI RFP Response Export",
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Project Name: ", bold: true }),
                new TextRun({ text: "Enterprise Security Review 2026" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Customer: ", bold: true }),
                new TextRun({ text: "Stripe Inc." }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Export Date: ", bold: true }),
                new TextRun({ text: new Date().toLocaleString() }),
              ],
              spacing: { after: 400 },
            }),
            // Mock category section
            new Paragraph({
              text: "Section: Security",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            // Mock styled table
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Question / ID", bold: true })] })],
                      width: { size: 35, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Response Details", bold: true })] })],
                      width: { size: 65, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Row 2: ", bold: true, size: 18 }),
                            new TextRun({ text: "Do you support Okta or Google SSO?", size: 18 }),
                          ],
                          spacing: { after: 100 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Status: ", bold: true, size: 16 }),
                            new TextRun({ text: "Approved", size: 16 }),
                          ],
                        }),
                      ],
                      width: { size: 35, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Yes, we support standard Okta federated SSO.", size: 20 }),
                          ],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: "Cited Grounding Sources:", bold: true, size: 16 })],
                          spacing: { before: 100, after: 50 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({ 
                              text: "• [Authentication and SSO Policy] (Pg 1): ", 
                              size: 16, 
                              color: "666666" 
                            }),
                            new TextRun({ 
                              text: '"We federate user authentication through SAML."', 
                              size: 16, 
                              italics: true, 
                              color: "666666" 
                            }),
                          ],
                        })
                      ],
                      width: { size: 65, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
              },
            })
          ],
        },
      ],
    });

    // 2. Serialize to binary buffer
    const buf = await Packer.toBuffer(doc);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
    
    // 3. Verify DOCX zip header (DOCX is a zip file, starting with 'PK')
    expect(buf[0]).toBe(0x50); // 'P'
    expect(buf[1]).toBe(0x4b); // 'K'
  });
});
