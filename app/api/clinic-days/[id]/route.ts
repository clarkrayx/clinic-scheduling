import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Find all sessions for this day
  const sessions = await prisma.clinicSession.findMany({
    where: { clinicDayId: id },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);

  // Delete in order: shift assignments → sessions → clinic day
  if (sessionIds.length > 0) {
    await prisma.shiftAssignment.deleteMany({
      where: { clinicSessionId: { in: sessionIds } },
    });
  }
  await prisma.clinicSession.deleteMany({ where: { clinicDayId: id } });
  await prisma.clinicDay.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
