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

  describe("RAG Synthesis Tones and Formatting Styles", () => {
    it("should format answer in Concise style", async () => {
      const result = await performLocalRAG("Does the platform support Okta or Google SSO?", "Concise");
      expect(result.confidence).toBe("High");
      const sentences = result.text.split(/(?<=[.!?])\s+/);
      expect(sentences.length).toBeLessThanOrEqual(2);
    });

    it("should format answer in Detailed style with bullet points", async () => {
      const result = await performLocalRAG("Does the platform support Okta or Google SSO?", "Detailed");
      expect(result.confidence).toBe("High");
      expect(result.text).toContain("•");
      expect(result.text.includes("Key Details:") || result.text.includes("Our platform handles this as follows:")).toBe(true);
    });

    it("should format answer in Yes/No with explanation style", async () => {
      const result = await performLocalRAG("Does the platform support Okta or Google SSO?", "YesNo");
      expect(result.confidence).toBe("High");
      expect(result.text.startsWith("Yes. ")).toBe(true);
    });

    it("should format answer in Formal style", async () => {
      const result = await performLocalRAG("Does the platform support Okta or Google SSO?", "Formal");
      expect(result.confidence).toBe("High");
      expect(result.text).toContain("AnswerFlow AI is pleased to confirm that");
    });

    it("should format answer in Security Questionnaire style", async () => {
      const result = await performLocalRAG("Does the platform support Okta or Google SSO?", "Security");
      expect(result.confidence).toBe("High");
      expect(result.text.startsWith("Security Policy Verification:")).toBe(true);
    });

    it("should format answer in Plain style, simplified vocabulary", async () => {
      const result = await performLocalRAG("Does the platform support Okta or Google SSO?", "Plain");
      expect(result.confidence).toBe("High");
      // Clean, unformatted base check to ensure Plain style runs and retains correct contents
      expect(result.text).toContain("Google Workspace SSO");
    });
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

  describe("Advanced Local RAG Engine Enhancements", () => {
    it("should expand synonyms and successfully match queries containing synonym terms", async () => {
      // "residency" expands to "region", "us", "eu", "europe", etc.
      // This will match the aws hosting chunk (which has "region" and "us-east-1" and "EU-only")
      const result = await performLocalRAG("Where is your server residency located?");
      expect(result.confidence).toBe("High");
      expect(result.text).toContain("AWS us-east-1 region");
    });

    it("should track and increment usage count of matched Q&A library approved answers", async () => {
      // 1. Get the starting usage count for Single Sign-On approved answer
      const approvedBefore = await prisma.approvedAnswer.findFirst({
        where: { canonicalQuestion: "Do you support Single Sign-On (SSO)?" }
      });
      expect(approvedBefore).toBeDefined();
      if (!approvedBefore) return;
      const initialCount = approvedBefore.usageCount;

      // 2. Perform RAG which matches this approved answer
      const result = await performLocalRAG("Does the platform support Okta or Google SSO?");
      expect(result.confidence).toBe("High");

      // 3. Retrieve again and verify count has incremented by 1
      const approvedAfter = await prisma.approvedAnswer.findFirst({
        where: { id: approvedBefore.id }
      });
      expect(approvedAfter).toBeDefined();
      if (!approvedAfter) return;
      expect(approvedAfter.usageCount).toBe(initialCount + 1);
      expect(approvedAfter.lastUsedAt).toBeDefined();
      expect(new Date(approvedAfter.lastUsedAt!).getTime()).toBeGreaterThan(0);
    });

    it("should match custom tones properly with synonym-boosted retrieval", async () => {
      // Query utilizes synonym "dr" -> backup/recovery/disaster
      const result = await performLocalRAG("What are the recovery timelines for DR?", "Concise");
      expect(result.confidence).toBe("High");
      expect(result.text).toContain("primary databases");
      // Concise tone limits sentences
      const sentences = result.text.split(/(?<=[.!?])\s+/);
      expect(sentences.length).toBeLessThanOrEqual(2);
    });
  });
});
