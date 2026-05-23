import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", 
  "at", "by", "for", "from", "in", "into", "of", "off", "on", "onto", 
  "out", "over", "to", "up", "with", "your", "this", "that", "have", "some"
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "";
  const boardId = searchParams.get("boardId");

  if (!title.trim() || !boardId) {
    return NextResponse.json([]);
  }

  try {
    // 1. Tokenize query title
    const queryTokens = title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(token => token.length > 2 && !STOP_WORDS.has(token));

    if (queryTokens.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch all posts on the board
    const posts = await prisma.feedbackPost.findMany({
      where: { boardId },
      include: {
        votes: { select: { id: true } }
      }
    });

    // 3. Compute keyword overlap scores
    const matches = posts.map(post => {
      const postTitleLower = post.title.toLowerCase().replace(/[^\w\s]/g, "");
      
      let matchScore = 0;
      queryTokens.forEach(token => {
        if (postTitleLower.includes(token)) {
          matchScore += 1;
        }
      });

      return {
        id: post.id,
        title: post.title,
        votesCount: post.votes.length,
        status: post.status,
        matchScore
      };
    });

    // 4. Filter and sort by match relevance and vote count
    const filteredMatches = matches
      .filter(m => m.matchScore > 0)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore; // Primary sort: match relevance
        }
        return b.votesCount - a.votesCount; // Secondary sort: vote count
      })
      .slice(0, 5); // Limit to top 5 candidates

    return NextResponse.json(filteredMatches);
  } catch (err: any) {
    console.error("Duplicate check error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
