import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { postId, userId, content } = body;

    if (!postId || !content || !content.trim()) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
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

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId
      },
      include: {
        user: { select: { name: true, avatarUrl: true } }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err: any) {
    console.error("Create comment error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
