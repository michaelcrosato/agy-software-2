import { describe, it, expect } from "vitest";

// The stop words filter used in our API
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", 
  "at", "by", "for", "from", "in", "into", "of", "off", "on", "onto", 
  "out", "over", "to", "up", "with", "your", "this", "that", "have", "some"
]);

// Scoring algorithm extracted for testing
function computeOverlapScore(inputTitle: string, existingTitle: string): number {
  const queryTokens = inputTitle
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));

  if (queryTokens.length === 0) return 0;

  const postTitleLower = existingTitle.toLowerCase().replace(/[^\w\s]/g, "");
  
  let matchScore = 0;
  queryTokens.forEach(token => {
    if (postTitleLower.includes(token)) {
      matchScore += 1;
    }
  });

  return matchScore;
}

describe("FeedFlow Semantic De-duplication Logic", () => {
  it("should extract tokens and ignore short and common stop-words", () => {
    const input = "Do add support for Google SSO login";
    const tokens = input
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(token => token.length > 2 && !STOP_WORDS.has(token));

    expect(tokens).toContain("support");
    expect(tokens).toContain("google");
    expect(tokens).toContain("sso");
    expect(tokens).toContain("login");
    expect(tokens).not.toContain("for"); // Stop word
    expect(tokens).not.toContain("do");  // Too short (length = 2)
  });

  it("should compute high overlap scores for highly relevant posts", () => {
    const input = "Google SSO support";
    const match1 = computeOverlapScore(input, "Add Google SSO integration to login");
    const match2 = computeOverlapScore(input, "Mobile dashboard responsiveness improvements");

    expect(match1).toBeGreaterThan(0);
    expect(match1).toBe(2); // Matches "google", "sso"
    expect(match2).toBe(0); // No overlap
  });

  it("should handle mixed casing and punctuation marks elegantly", () => {
    const input = "Google SSO!!";
    const score = computeOverlapScore(input, "google sso integration");
    expect(score).toBe(2);
  });
});
