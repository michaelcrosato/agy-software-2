import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { postId, userId } = body;

    if (!postId) {
      return NextResponse.json({ message: "Missing postId" }, { status: 400 });
    }

    // Resolve mock user ID to database user ID
    const users = await prisma.user.findMany();
    if (!userId) {
      userId = users[0].id;
    } else {
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        if (userId.includes("alex")) {
          userId = users.find(u => u.email.includes("alex"))?.id || users[0].id;
        } else if (userId.includes("sarah")) {
          userId = users.find(u => u.email.includes("sarah"))?.id || users[0].id;
        } else {
          userId = users.find(u => u.email.includes("michael"))?.id || users[0].id;
        }
      }
    }

    // Check if the user has already voted for this post
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingVote) {
      // Remove upvote
      await prisma.vote.delete({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      });
      return NextResponse.json({ message: "Vote removed", voted: false });
    } else {
      // Add upvote
      await prisma.vote.create({
        data: {
          userId,
          postId
        }
      });
      return NextResponse.json({ message: "Vote added", voted: true });
    }
  } catch (err: any) {
    console.error("Vote toggle error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
