import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(users);
  } catch (err: any) {
    console.error("GET users error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
