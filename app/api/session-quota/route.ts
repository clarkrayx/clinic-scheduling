import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "0");
  const month = parseInt(searchParams.get("month") ?? "0");

  const quotas = await prisma.monthlySessionQuota.findMany({
    where: { year, month },
    include: { assistant: { include: { user: true } } },
  });

  return NextResponse.json(quotas.map((q) => ({
    id: q.id,
    assistantId: q.assistantId,
    assistantName: q.assistant.user.name,
    sessions: q.sessions,
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assistantId, year, month, sessions, leaveSessions, leaveNote } = await req.json();

  const quota = await prisma.monthlySessionQuota.upsert({
    where: { assistantId_year_month: { assistantId, year, month } },
    update: { sessions, leaveSessions: leaveSessions ?? 0, leaveNote: leaveNote ?? null },
    create: { assistantId, year, month, sessions, leaveSessions: leaveSessions ?? 0, leaveNote: leaveNote ?? null },
  });

  return NextResponse.json(quota);
}
