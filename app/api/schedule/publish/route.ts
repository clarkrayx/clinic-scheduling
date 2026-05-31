import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, month } = await req.json();

  const schedule = await prisma.schedule.update({
    where: { year_month: { year, month } },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  return NextResponse.json(schedule);
}
