import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/cluster-epics
export async function GET() {
  try {
    const epics = await prisma.epic.findMany({
      include: {
        posts: {
          include: {
            author: { select: { name: true, avatarUrl: true } },
            votes: { select: { id: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const totalPosts = await prisma.feedbackPost.count();
    const totalVotes = await prisma.vote.count();
    const totalComments = await prisma.comment.count();
    const totalBoards = await prisma.board.count();

    return NextResponse.json({
      epics,
      stats: {
        totalPosts,
        totalVotes,
        totalComments,
        totalBoards
      }
    });
  } catch (err: any) {
    console.error("GET epics error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", 
  "at", "by", "for", "from", "in", "into", "of", "off", "on", "onto", 
  "out", "over", "to", "up", "with", "your", "this", "that", "have", "some",
  "please", "want", "would", "like", "should", "need", "allow", "support",
  "adding", "unable", "issues", "glitches", "error", "fails", "working"
]);

// POST /api/admin/cluster-epics
export async function POST() {
  try {
    // 1. Fetch all feedback posts that do not currently belong to an Epic
    const unclusteredPosts = await prisma.feedbackPost.findMany({
      where: { epicId: null }
    });

    if (unclusteredPosts.length === 0) {
      return NextResponse.json({ 
        message: "No unclustered feedback posts found. All posts are already organized into Epics!", 
        clusteredCount: 0 
      });
    }

    // 2. Tokenize titles and count keyword frequencies across posts
    const postKeywords = unclusteredPosts.map(post => {
      const tokens = post.title
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(t => t.length > 2 && !STOP_WORDS.has(t));
      return { post, tokens };
    });

    const freqMap: Record<string, number> = {};
    postKeywords.forEach(({ tokens }) => {
      // Deduplicate within the same title to measure document frequency
      const uniqueTokens = Array.from(new Set(tokens));
      uniqueTokens.forEach(t => {
        freqMap[t] = (freqMap[t] || 0) + 1;
      });
    });

    // Sort keywords by frequency (only keeping those with at least 2 occurrences if possible)
    const sortedKeywords = Object.entries(freqMap)
      .filter(([_, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1]);

    let clusteredCount = 0;
    const createdClusters: string[] = [];

    // 3. Form clusters around the most frequent keywords
    for (const [keyword, count] of sortedKeywords) {
      // Find posts containing this keyword that haven't been assigned an Epic yet
      const matchingPosts = postKeywords.filter(({ post, tokens }) => 
        !post.epicId && tokens.includes(keyword)
      );

      if (matchingPosts.length >= 1) {
        // Create an Epic for this theme
        const epicName = `🤖 Theme: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Improvements`;
        const epicDescription = `Auto-clustered feedback relating to the keyword '${keyword}' (${matchingPosts.length} posts).`;

        const newEpic = await prisma.epic.create({
          data: {
            name: epicName,
            description: epicDescription
          }
        });

        // Update the posts to link to this Epic
        const postIds = matchingPosts.map(m => m.post.id);
        await prisma.feedbackPost.updateMany({
          where: {
            id: { in: postIds }
          },
          data: {
            epicId: newEpic.id
          }
        });

        // Mark as clustered in memory to avoid overlapping cluster conflicts
        matchingPosts.forEach(({ post }) => {
          post.epicId = newEpic.id;
        });

        clusteredCount += matchingPosts.length;
        createdClusters.push(epicName);
      }
    }

    // 4. For any remaining posts that couldn't be grouped, assign them to a catch-all "General Features" Epic
    const remainingUnclustered = postKeywords.filter(({ post }) => !post.epicId);
    if (remainingUnclustered.length > 0) {
      let generalEpic = await prisma.epic.findFirst({
        where: { name: "🤖 Theme: Miscellaneous Features" }
      });

      if (!generalEpic) {
        generalEpic = await prisma.epic.create({
          data: {
            name: "🤖 Theme: Miscellaneous Features",
            description: "Auto-clustered general and miscellaneous feedback items."
          }
        });
      }

      const postIds = remainingUnclustered.map(m => m.post.id);
      await prisma.feedbackPost.updateMany({
        where: {
          id: { in: postIds }
        },
        data: {
          epicId: generalEpic.id
        }
      });
      clusteredCount += remainingUnclustered.length;
      createdClusters.push(generalEpic.name);
    }

    return NextResponse.json({
      message: `Successfully clustered ${clusteredCount} posts into Epics.`,
      clusteredCount,
      createdClusters
    });
  } catch (err: any) {
    console.error("Clustering error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
