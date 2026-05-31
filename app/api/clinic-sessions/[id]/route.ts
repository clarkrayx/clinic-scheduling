import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Delete shift assignments referencing this session before deleting the session
  await prisma.shiftAssignment.deleteMany({ where: { clinicSessionId: id } });
  await prisma.clinicSession.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
