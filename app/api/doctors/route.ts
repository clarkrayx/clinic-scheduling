import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, specialty, phone, notes } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const doctor = await prisma.doctor.create({
    data: { name, specialty, phone, notes },
  });
  return NextResponse.json(doctor);
}
