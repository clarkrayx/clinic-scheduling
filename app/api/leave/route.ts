import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, reason, assistantId } = await req.json();
  if (!date || !assistantId) {
    return NextResponse.json({ error: "Date and assistantId required" }, { status: 400 });
  }

  const leave = await prisma.leaveRequest.create({
    data: { assistantId, date: new Date(date), reason },
  });

  return NextResponse.json(leave);
}
