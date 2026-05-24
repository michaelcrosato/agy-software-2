import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";

describe("AnswerFlow AI DOCX Ingestion and Parsing", () => {
  it("should successfully extract raw text from single-paragraph.docx using mammoth", async () => {
    const filePath = path.join(process.cwd(), "tests", "single-paragraph.docx");
    const buffer = fs.readFileSync(filePath);
    
    const result = await mammoth.extractRawText({ buffer });
    expect(result.value).toContain("Walking on imported air");
    expect(result.messages.length).toBe(0);
  });

  it("should correctly split extracted DOCX text into potential questions based on regular expressions", () => {
    const mockExtractedText = `
      AnswerFlow RFP Questionnaire
      
      1. Does the platform support Okta or Google SSO?
      This is standard paragraph text explaining the context.
      
      How frequently are database backups performed?
      
      3. What is your company's dress code policy?
      
      This is a normal sentence that does not end in a question mark.
    `;

    const lines = mockExtractedText
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 5 && (line.endsWith("?") || /^\d+\.?\s+/.test(line)));

    expect(lines.length).toBe(3);
    expect(lines[0]).toBe("1. Does the platform support Okta or Google SSO?");
    expect(lines[1]).toBe("How frequently are database backups performed?");
    expect(lines[2]).toBe("3. What is your company's dress code policy?");
  });
});
