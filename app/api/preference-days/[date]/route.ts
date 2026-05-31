import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const { searchParams } = new URL(req.url);
  const assistantId = searchParams.get("assistantId");
  const sessionType = searchParams.get("sessionType");

  if (!assistantId || !sessionType) {
    return NextResponse.json({ error: "assistantId and sessionType required" }, { status: 400 });
  }

  await prisma.preferenceDay.deleteMany({
    where: { assistantId, date: new Date(date), sessionType },
  });

  return NextResponse.json({ ok: true });
}
