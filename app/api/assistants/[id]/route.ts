import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, email, newPassword, skills, notes, isActive, isTraining, maxSessionsPerMonth, preferences } = await req.json();

  const assistant = await prisma.assistant.findUnique({ where: { id }, include: { user: true } });
  if (!assistant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check email uniqueness if changing
  if (email && email !== assistant.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "此 Email 已被使用" }, { status: 409 });
  }

  const userUpdateData: Record<string, unknown> = { name };
  if (email) userUpdateData.email = email;
  if (newPassword && newPassword.length >= 8) {
    userUpdateData.password = await bcrypt.hash(newPassword, 12);
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: assistant.userId }, data: userUpdateData }),
    prisma.assistant.update({
      where: { id },
      data: {
        skills: JSON.stringify(skills),
        notes,
        ...(isActive !== undefined && { isActive }),
        ...(isTraining !== undefined && { isTraining }),
        ...(maxSessionsPerMonth !== undefined && { maxSessionsPerMonth: maxSessionsPerMonth || null }),
        ...(preferences !== undefined && { preferences }),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const assistant = await prisma.assistant.findUnique({ where: { id } });
  if (!assistant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete related records in order before removing the user
  await prisma.$transaction([
    prisma.preferenceDay.deleteMany({ where: { assistantId: id } }),
    prisma.leaveRequest.deleteMany({ where: { assistantId: id } }),
    prisma.shiftAssignment.deleteMany({ where: { assistantId: id } }),
    prisma.assistant.delete({ where: { id } }),
    prisma.user.delete({ where: { id: assistant.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
