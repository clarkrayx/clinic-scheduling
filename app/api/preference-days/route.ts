import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "0");
  const month = parseInt(searchParams.get("month") ?? "0");
  const assistantId = searchParams.get("assistantId");

  if (!assistantId || !year || !month) {
    return NextResponse.json({ error: "assistantId, year, month required" }, { status: 400 });
  }

  const days = await prisma.preferenceDay.findMany({
    where: { assistantId, year, month },
    select: { date: true, assistantId: true, sessionType: true },
  });

  return NextResponse.json(days.map((d) => ({
    assistantId: d.assistantId,
    date: d.date.toISOString().slice(0, 10),
    sessionType: d.sessionType,
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date, sessionType, reason, assistantId } = await req.json();
  if (!date || !assistantId || !sessionType) {
    return NextResponse.json({ error: "date, assistantId, sessionType required" }, { status: 400 });
  }

  const d = new Date(date);
  const pref = await prisma.preferenceDay.upsert({
    where: { assistantId_date_sessionType: { assistantId, date: d, sessionType } },
    update: { reason },
    create: {
      assistantId,
      date: d,
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      sessionType,
      reason,
    },
  });

  return NextResponse.json(pref);
}
