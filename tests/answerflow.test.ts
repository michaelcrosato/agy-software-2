import { describe, it, expect, beforeAll } from "vitest";
import { performLocalRAG } from "../lib/rag";
import { prisma } from "../lib/prisma";

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
});
