import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";

describe("AnswerFlow AI User API & Team Management", () => {
  const testEmail = "test-expert-temp@example.com";

  beforeAll(async () => {
    // Clean up any test users that might exist
    await prisma.user.deleteMany({
      where: {
        email: testEmail
      }
    });
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: {
        email: testEmail
      }
    });
  });

  it("should retrieve users successfully via prisma", async () => {
    const users = await prisma.user.findMany();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it("should create a new user teammate in the database", async () => {
    const name = "Test Expert User";
    const seed = encodeURIComponent(name);
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

    const newUser = await prisma.user.create({
      data: {
        name,
        email: testEmail,
        avatarUrl
      }
    });

    expect(newUser).toBeDefined();
    expect(newUser.email).toBe(testEmail);
    expect(newUser.name).toBe(name);
    expect(newUser.avatarUrl).toContain("dicebear");

    // Fetch again and verify existence
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    expect(dbUser).toBeDefined();
    expect(dbUser?.name).toBe(name);
  });

  it("should prevent duplicate emails", async () => {
    await expect(() =>
      prisma.user.create({
        data: {
          name: "Another Name",
          email: testEmail
        }
      })
    ).rejects.toThrow();
  });
});
