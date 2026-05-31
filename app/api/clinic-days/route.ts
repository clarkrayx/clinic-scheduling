import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await req.json();
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  const clinicDay = await prisma.clinicDay.upsert({
    where: { date: new Date(date) },
    update: { isOpen: true },
    create: { date: new Date(date), isOpen: true },
  });

  return NextResponse.json(clinicDay);
}
