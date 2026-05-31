import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 助理取消一筆畫假（用 assistantId + date 刪除）
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const { searchParams } = new URL(req.url);
  const assistantId = searchParams.get("assistantId");
  if (!assistantId) {
    return NextResponse.json({ error: "assistantId required" }, { status: 400 });
  }

  await prisma.preferenceDay.deleteMany({
    where: { assistantId, date: new Date(date) },
  });

  return NextResponse.json({ ok: true });
}
