// @vitest-environment node
/**
 * Integration test — F-0002: Prisma + SQLite seed fixtures
 * Runs the real `npm run seed` contract twice (idempotency), then asserts
 * counts and specific data shapes via the shared Prisma client.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import prisma from "../src/lib/prisma";

const ROOT = resolve(__dirname, "..");

beforeAll(() => {
  // Run seed TWICE to prove idempotency at the contract level.
  // Timeout bumped: prisma db push + tsx on Windows + Linux CI can be slow.
  execSync("npm run seed", {
    cwd: ROOT,
    stdio: "inherit",
    timeout: 120_000,
  });
  execSync("npm run seed", {
    cwd: ROOT,
    stdio: "inherit",
    timeout: 120_000,
  });
}, 300_000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Seed fixtures — counts", () => {
  it("has exactly 1 project", async () => {
    const count = await prisma.project.count();
    expect(count).toBe(1);
  });

  it("has exactly 10 questions (≥8 required by acceptance criteria)", async () => {
    const count = await prisma.question.count();
    expect(count).toBe(10);
    expect(count).toBeGreaterThanOrEqual(8);
  });

  it("has exactly 3 sources (≥2 required by acceptance criteria)", async () => {
    const count = await prisma.source.count();
    expect(count).toBe(3);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("has exactly 15 chunks (≥10 required by acceptance criteria)", async () => {
    const count = await prisma.chunk.count();
    expect(count).toBe(15);
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it("has exactly 2 answers", async () => {
    const count = await prisma.answer.count();
    expect(count).toBe(2);
  });

  it("has exactly 3 users", async () => {
    const count = await prisma.user.count();
    expect(count).toBe(3);
  });
});

describe("Seed fixtures — data quality", () => {
  it("has 8 unanswered questions and 2 drafted questions", async () => {
    const unanswered = await prisma.question.count({
      where: { status: "unanswered" },
    });
    const drafted = await prisma.question.count({
      where: { status: "drafted" },
    });
    expect(unanswered).toBe(8);
    expect(drafted).toBe(2);
  });

  it("both drafted questions have an Answer row attached", async () => {
    const draftedWithAnswers = await prisma.question.findMany({
      where: { status: "drafted" },
      include: { answer: true },
    });
    expect(draftedWithAnswers).toHaveLength(2);
    for (const q of draftedWithAnswers) {
      expect(q.answer).not.toBeNull();
      expect(q.answer?.text.length).toBeGreaterThan(0);
    }
  });

  it("near-duplicate SSO pair exists (q-01 vs q-02)", async () => {
    const q01 = await prisma.question.findUnique({ where: { id: "q-01" } });
    const q02 = await prisma.question.findUnique({ where: { id: "q-02" } });
    expect(q01?.text).toBe("Do you support single sign-on (SSO)?");
    expect(q02?.text).toBe(
      "Does your platform integrate with SAML/SSO identity providers?"
    );
  });

  it("near-duplicate backup frequency pair exists (q-05 vs q-06)", async () => {
    const q05 = await prisma.question.findUnique({ where: { id: "q-05" } });
    const q06 = await prisma.question.findUnique({ where: { id: "q-06" } });
    expect(q05?.text).toBe("How frequently do you perform database backups?");
    expect(q06?.text).toBe(
      "What is your backup frequency and retention policy for customer data?"
    );
  });

  it("chunks are distributed across 3 sources (5 each)", async () => {
    const ssoCount = await prisma.chunk.count({ where: { sourceId: "src-sso" } });
    const bdrCount = await prisma.chunk.count({ where: { sourceId: "src-bdr" } });
    const gdprCount = await prisma.chunk.count({ where: { sourceId: "src-gdpr" } });
    expect(ssoCount).toBe(5);
    expect(bdrCount).toBe(5);
    expect(gdprCount).toBe(5);
  });

  it("questions have expected orders 1–10", async () => {
    const questions = await prisma.question.findMany({
      orderBy: { order: "asc" },
    });
    const orders = questions.map((q) => q.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("at least one question has a null category", async () => {
    const nullCatCount = await prisma.question.count({
      where: { category: null },
    });
    expect(nullCatCount).toBeGreaterThanOrEqual(1);
  });
});

describe("Seed fixtures — idempotency", () => {
  it("counts are identical after two consecutive seed runs (no duplicates)", async () => {
    // If there were any duplicate-insert bugs, the counts above would already
    // be wrong. Here we re-read counts for an explicit double-run assertion.
    const projects = await prisma.project.count();
    const questions = await prisma.question.count();
    const sources = await prisma.source.count();
    const chunks = await prisma.chunk.count();
    const answers = await prisma.answer.count();
    const users = await prisma.user.count();

    // These are the exact values after one seed run; two runs must yield the same.
    expect(projects).toBe(1);
    expect(questions).toBe(10);
    expect(sources).toBe(3);
    expect(chunks).toBe(15);
    expect(answers).toBe(2);
    expect(users).toBe(3);
  });
});
