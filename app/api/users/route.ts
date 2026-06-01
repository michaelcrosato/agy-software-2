import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(users);
  } catch (err: unknown) {
    console.error("GET users error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ message: "Server error", error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Teammate with this email is already invited" }, { status: 400 });
    }

    const seed = encodeURIComponent(name || email);
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

    const newUser = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        avatarUrl
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err: unknown) {
    console.error("POST users error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ message: "Server error", error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

