import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password, skills, notes } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, password required" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "ASSISTANT",
      assistant: {
        create: { skills: skills ?? [], notes },
      },
    },
    include: { assistant: true },
  });

  return NextResponse.json(user);
}
