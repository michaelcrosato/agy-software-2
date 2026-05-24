import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";

describe("AnswerFlow AI Excel Workbook Integration", () => {
  it("should create a valid workbook and serialize it to buffer", () => {
    const wb = XLSX.utils.book_new();
    const headers = ["Question Location", "Question Text", "Category", "Status"];
    const rows = [
      ["Row 2", "Do you support SSO?", "Security", "Approved"],
      ["Row 3", "Explain backup cycles.", "Infrastructure", "Draft"]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Test Questionnaire");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("should parse a binary Excel sheet array buffer back into headers and rows", () => {
    // 1. Create a mock workbook in memory
    const wb = XLSX.utils.book_new();
    const originalHeaders = ["Question Text", "Category", "Location"];
    const originalRows = [
      ["Does the platform support SAML?", "Security", "Row 12"],
      ["What is your SLA timeline?", "Compliance", "Row 13"]
    ];

    const ws = XLSX.utils.aoa_to_sheet([originalHeaders, ...originalRows]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // 2. Read the workbook back as if it was uploaded
    const workbook = XLSX.read(new Uint8Array(buf), { type: "array" });
    expect(workbook.SheetNames).toContain("Sheet1");

    const worksheet = workbook.Sheets["Sheet1"];
    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });

    expect(jsonData.length).toBe(3); // Headers + 2 rows
    const headers = jsonData[0].map(val => String(val).trim());
    const rows = jsonData.slice(1).map(row => 
      Array.from({ length: headers.length }, (_, i) => String(row[i] || "").trim())
    );

    expect(headers).toEqual(originalHeaders);
    expect(rows[0][0]).toBe("Does the platform support SAML?");
    expect(rows[1][1]).toBe("Compliance");
  });
});
