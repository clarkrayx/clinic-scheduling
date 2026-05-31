import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, skills, notes, isActive } = await req.json();

  const assistant = await prisma.assistant.findUnique({ where: { id }, include: { user: true } });
  if (!assistant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: assistant.userId }, data: { name } }),
    prisma.assistant.update({ where: { id }, data: { skills, notes, isActive } }),
  ]);

  return NextResponse.json({ ok: true });
}
