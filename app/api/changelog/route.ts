import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all changelogs
export async function GET() {
  try {
    const changelogs = await prisma.changelog.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(changelogs);
  } catch (err: any) {
    console.error("GET changelogs error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

// POST to generate AI-synthesized changelog based on Completed items
export async function POST() {
  try {
    // 1. Query all posts with "Completed" status
    const completedPosts = await prisma.feedbackPost.findMany({
      where: { status: "Completed" },
      include: {
        author: { select: { name: true } },
        votes: { select: { id: true } }
      }
    });

    if (completedPosts.length === 0) {
      return NextResponse.json(
        { message: "No completed feedback items found to synthesize! Please mark a post status as 'Completed' first to test." },
        { status: 400 }
      );
    }

    // 2. Synthesize release title
    const primaryPost = completedPosts.reduce((prev, current) => 
      (current.votes.length > prev.votes.length) ? current : prev
    );
    const releaseTitle = `🚀 Released ${primaryPost.title.replace(/[.!]/g, "")} & More!`;

    // 3. Synthesize release content
    let content = `We are thrilled to bring you our latest product updates! Thanks to valuable feedback from our amazing community, we have designed, tested, and released several key upgrades: \n\n`;

    completedPosts.forEach((post) => {
      const emoji = post.category === "Bug" ? "🐛" : post.category === "Improvement" ? "⚡" : "🚀";
      const votesText = post.votes.length > 0 ? ` (${post.votes.length} community upvotes)` : "";
      
      content += `### ${emoji} ${post.title}\n`;
      content += `${post.description}\n`;
      if (post.author?.name) {
        content += `*Special thanks to **${post.author.name}** for submitting this request${votesText}!*\n\n`;
      } else {
        content += `*Priority boosted by community upvotes${votesText}!*\n\n`;
      }
    });

    content += `***\n\n`;
    content += `Have more suggestions or spotted a bug? Head over to our Core Features and Bug Report boards to vote, comment, and help shape our next sprint!`;

    // 4. Save to Database
    const changelog = await prisma.changelog.create({
      data: {
        title: releaseTitle,
        content,
        publishedAt: new Date()
      }
    });

    // 5. Update statuses of the completed posts to "Closed" or "Released" to prevent double seeding next time
    await prisma.feedbackPost.updateMany({
      where: {
        id: { in: completedPosts.map(p => p.id) }
      },
      data: {
        status: "Closed" // Update to closed so they don't get compiled again
      }
    });

    return NextResponse.json(changelog, { status: 201 });
  } catch (err: any) {
    console.error("AI Changelog synthesis error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
