import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all feedback posts for a specific board (queried by slug or ID)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boardSlug = searchParams.get("boardSlug");
  const sort = searchParams.get("sort") || "votes"; // "votes" or "new"
  const filter = searchParams.get("filter") || "all"; // "all", "Under Review", "Planned", "In Progress", "Completed", "Closed"

  if (!boardSlug) {
    return NextResponse.json({ message: "Missing boardSlug" }, { status: 400 });
  }

  try {
    const board = await prisma.board.findUnique({
      where: { slug: boardSlug }
    });

    if (!board) {
      return NextResponse.json({ message: "Board not found" }, { status: 404 });
    }

    // Build query conditions
    const whereConditions: any = { boardId: board.id };
    if (filter !== "all") {
      whereConditions.status = filter;
    }

    const posts = await prisma.feedbackPost.findMany({
      where: whereConditions,
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true }
        },
        votes: {
          select: { userId: true }
        },
        comments: {
          include: {
            user: { select: { name: true, avatarUrl: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    // Custom sorting in JS since vote count is dynamic
    const formattedPosts = posts.map(post => ({
      ...post,
      votesCount: post.votes.length,
      commentsCount: post.comments.length
    }));

    if (sort === "votes") {
      formattedPosts.sort((a, b) => b.votesCount - a.votesCount);
    } else {
      formattedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({ board, posts: formattedPosts });
  } catch (err: any) {
    console.error("GET posts error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

// POST a new feedback post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, boardId, authorId } = body;

    if (!title || !description || !boardId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Find or create a user if not provided (fallback)
    let finalAuthorId = authorId;
    if (!finalAuthorId) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        finalAuthorId = defaultUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: "anonymous@example.com",
            name: "Anonymous User",
            avatarUrl: "https://avatars.githubusercontent.com/u/99?v=4"
          }
        });
        finalAuthorId = newUser.id;
      }
    } else {
      // In local switcher, user ID has mock text (e.g. "alex-johnson-id-seeded")
      // Check if user actually exists or map mock user to seeded DB user
      let userExists = await prisma.user.findUnique({ where: { id: finalAuthorId } });
      if (!userExists) {
        // Fallback: match by name or email
        const users = await prisma.user.findMany();
        if (finalAuthorId.includes("alex")) {
          finalAuthorId = users.find(u => u.email.includes("alex"))?.id || users[0].id;
        } else if (finalAuthorId.includes("sarah")) {
          finalAuthorId = users.find(u => u.email.includes("sarah"))?.id || users[0].id;
        } else {
          finalAuthorId = users.find(u => u.email.includes("michael"))?.id || users[0].id;
        }
      }
    }

    const post = await prisma.feedbackPost.create({
      data: {
        title,
        description,
        category,
        boardId,
        authorId: finalAuthorId,
        status: "Under Review"
      }
    });

    // Auto-create a vote for the author by default!
    await prisma.vote.create({
      data: {
        userId: finalAuthorId,
        postId: post.id
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err: any) {
    console.error("POST post error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
