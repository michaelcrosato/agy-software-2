import { describe, it, expect } from "vitest";
import { readSheet } from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";

describe("AnswerFlow AI Excel Workbook Integration", () => {
  it("should create a valid workbook and serialize it to buffer", async () => {
    const headers = ["Question Location", "Question Text", "Category", "Status"];
    const rows = [
      ["Row 2", "Do you support SSO?", "Security", "Approved"],
      ["Row 3", "Explain backup cycles.", "Infrastructure", "Draft"]
    ];

    const buf = await writeXlsxFile([headers, ...rows], {
      sheet: "Test Questionnaire"
    }).toBuffer();

    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("should parse a binary Excel sheet buffer back into headers and rows", async () => {
    const originalHeaders = ["Question Text", "Category", "Location"];
    const originalRows = [
      ["Does the platform support SAML?", "Security", "Row 12"],
      ["What is your SLA timeline?", "Compliance", "Row 13"]
    ];

    const buf = await writeXlsxFile([originalHeaders, ...originalRows], {
      sheet: "Sheet1"
    }).toBuffer();

    const jsonData = await readSheet(buf);

    expect(jsonData.length).toBe(3); // Headers + 2 rows
    const headers = jsonData[0].map(val => String(val ?? "").trim());
    const rows = jsonData.slice(1).map(row => 
      Array.from({ length: headers.length }, (_, i) => String(row[i] ?? "").trim())
    );

    expect(headers).toEqual(originalHeaders);
    expect(rows[0][0]).toBe("Does the platform support SAML?");
    expect(rows[1][1]).toBe("Compliance");
  });
});
