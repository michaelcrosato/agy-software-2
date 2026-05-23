import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(boards);
  } catch (err: any) {
    console.error("GET boards error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
