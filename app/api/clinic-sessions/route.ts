import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clinicDayId, clinicId, sessionType, startTime, endTime, doctorIds, counterNeeded, mobileNeeded } = await req.json();

  const clinicSession = await prisma.clinicSession.create({
    data: {
      clinicDayId,
      clinicId: clinicId || null,
      sessionType,
      startTime,
      endTime,
      doctorIds: JSON.stringify(doctorIds ?? []),
      counterNeeded: counterNeeded ?? 4,
      mobileNeeded: mobileNeeded ?? 4,
    },
  });

  return NextResponse.json(clinicSession);
}
