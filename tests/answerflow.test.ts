import { describe, it, expect, beforeAll } from "vitest";
import { performLocalRAG } from "../lib/rag";
import { prisma } from "../lib/prisma";
import { GET as exportGET } from "../app/api/projects/[id]/export/route";

function findCsvRow(csvText: string, sourceLocation: string) {
  return csvText
    .split(/\r?\n/)
    .find(row => row.startsWith(`"${sourceLocation}",`));
}

describe("AnswerFlow AI Local RAG Engine", () => {
  beforeAll(async () => {
    // Ensure database is seeded before running tests
    const usersCount = await prisma.user.count();
    if (usersCount === 0) {
      console.log("No seed detected in tests, skipping RAG validation check.");
    }
  });

  it("should match SSO query against seeded SSO source document", async () => {
    const result = await performLocalRAG("Does the platform support Okta or Google SSO?");
    expect(result.confidence).toBe("High");
    expect(result.text).toContain("Google Workspace SSO, Okta, and SAML 2.0");
    expect(result.citations.length).toBeGreaterThan(0);
  });

  it("should match backup frequency question against seeded disaster recovery doc", async () => {
    const result = await performLocalRAG("How frequently are database backups performed?");
    expect(result.confidence).toBe("High");
    expect(result.text).toContain("backed up continuously");
    expect(result.citations.length).toBeGreaterThan(0);
  });

  it("should handle completely out-of-scope question with 'No Source' fallback", async () => {
    const result = await performLocalRAG("What is your company's dress code policy?");
    expect(result.confidence).toBe("No Source");
    expect(result.text).toContain("No matching information was found");
    expect(result.citations.length).toBe(0);
  });

  describe("Sensitive Claim Controls Export Integration", () => {
    it("should redact unapproved sensitive questions in export by default", async () => {
      const project = await prisma.responseProject.findFirst({
        where: { name: "Enterprise Security Audit 2026" }
      });
      expect(project).toBeDefined();
      if (!project) return;

      const req = new Request(`http://localhost/api/projects/${project.id}/export?format=csv`);
      const response = await exportGET(req, { params: Promise.resolve({ id: project.id }) });
      expect(response.status).toBe(200);

      const text = await response.text();
      // Question 1 is category: Security, status: Needs Review (Unapproved)
      // Drafted answer should be blocked/redacted
      const row12 = findCsvRow(text, "Row 12");
      expect(row12).toBeDefined();
      expect(row12).toContain("[BLOCKED: Requires human approval before export]");
      expect(row12).not.toContain("Yes, we support Google Workspace SSO");
    });

    it("should allow bypassing redaction but prepend warnings when query param is true", async () => {
      const project = await prisma.responseProject.findFirst({
        where: { name: "Enterprise Security Audit 2026" }
      });
      expect(project).toBeDefined();
      if (!project) return;

      const req = new Request(`http://localhost/api/projects/${project.id}/export?format=csv&allowUnapprovedSensitive=true`);
      const response = await exportGET(req, { params: Promise.resolve({ id: project.id }) });
      expect(response.status).toBe(200);

      const text = await response.text();
      // Question 1 drafted answer should be present but contain the unapproved prefix warning
      const row12 = findCsvRow(text, "Row 12");
      expect(row12).toBeDefined();
      expect(row12).toContain("[UNAPPROVED SENSITIVE CLAIM: USE WITH CAUTION] Yes, we support Google Workspace SSO");
      expect(text).not.toContain('"[BLOCKED: Requires human approval before export]"');
    });
  });
});
