import { describe, it, expect, vi } from "vitest";

// Mock pdf-parse module
vi.mock("pdf-parse", () => {
  return {
    PDFParse: class {
      options: any;
      constructor(options: any) {
        this.options = options;
      }
      getText() {
        return Promise.resolve({
          text: "1. Does the platform support Okta or Google SSO?\nSome normal text.\nHow frequently are database backups performed?"
        });
      }
    }
  };
});

describe("AnswerFlow AI PDF Ingestion and Parsing", () => {
  it("should correctly split extracted PDF text into potential questions based on regular expressions", () => {
    const mockExtractedText = `
      AnswerFlow RFP PDF Document
      
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

  it("should load mock PDFParse class and simulate text extraction", async () => {
    // Dynamically import the mocked pdf-parse module
    const { PDFParse } = (await import("pdf-parse")) as any;
    const parser = new PDFParse({ data: Buffer.from("mock pdf buffer") });
    const result = await parser.getText();
    
    expect(result.text).toContain("Does the platform support Okta or Google SSO?");
    expect(result.text).toContain("How frequently are database backups performed?");
  });
});
