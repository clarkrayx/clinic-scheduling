import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateSchedule } from "@/lib/ai-scheduler";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, month } = await req.json();
  if (!year || !month) {
    return NextResponse.json({ error: "Year and month required" }, { status: 400 });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Fetch all required data
  const [clinicDays, assistants, preferenceDays, specialRules, doctors, sessionQuotas] = await Promise.all([
    prisma.clinicDay.findMany({
      where: { date: { gte: startDate, lte: endDate }, isOpen: true },
      include: { sessions: { include: { clinic: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.assistant.findMany({
      where: { isActive: true },
      include: { user: true },
    }),
    prisma.preferenceDay.findMany({
      where: { year, month },
    }),
    prisma.specialRule.findMany({ where: { isActive: true } }),
    prisma.doctor.findMany({ where: { isActive: true } }),
    prisma.monthlySessionQuota.findMany({ where: { year, month } }),
  ]);

  if (clinicDays.length === 0) {
    return NextResponse.json({ error: "本月沒有設定開診日，請先設定診日。" }, { status: 400 });
  }
  if (assistants.length === 0) {
    return NextResponse.json({ error: "沒有可排班的助理，請先新增助理。" }, { status: 400 });
  }

  // Build AI input
  const aiInput = {
    year,
    month,
    clinicDays: clinicDays.map((day) => ({
      date: day.date.toISOString().slice(0, 10),
      sessions: (day as { sessions: { id: string; sessionType: string; startTime: string; endTime: string; counterNeeded: number; mobileNeeded: number; doctorIds: string; clinic: { name: string } | null }[] }).sessions.map((s) => ({
        id: s.id,
        sessionType: s.sessionType,
        startTime: s.startTime,
        endTime: s.endTime,
        clinicName: s.clinic?.name,
        doctorIds: JSON.parse(s.doctorIds ?? "[]"),
        counterNeeded: s.counterNeeded,
        mobileNeeded: s.mobileNeeded,
      })),
    })),
    assistants: assistants.map((a) => ({
      id: a.id,
      name: a.user.name,
      skills: JSON.parse(a.skills as string),
      maxSessionsPerMonth: (a as unknown as { maxSessionsPerMonth: number | null }).maxSessionsPerMonth ?? null,
    })),
    preferenceDays: preferenceDays.map((p) => ({
      assistantId: p.assistantId,
      date: p.date.toISOString().slice(0, 10),
      sessionType: p.sessionType,
    })),
    specialRules: specialRules.map((r) => ({
      title: r.title,
      description: r.description,
      ruleType: r.ruleType,
      config: r.config,
      isMandatory: r.isMandatory,
    })),
    sessionQuotas: sessionQuotas.map((q) => ({
      assistantId: q.assistantId,
      sessions: q.sessions,
    })),
    doctors: doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
    })),
  };

  let aiResult;
  try {
    aiResult = await generateSchedule(aiInput);
  } catch (err) {
    return NextResponse.json(
      { error: `AI 排班失敗：${err instanceof Error ? err.message : "未知錯誤"}` },
      { status: 500 }
    );
  }

  // Save schedule to database (upsert)
  const schedule = await prisma.schedule.upsert({
    where: { year_month: { year, month } },
    update: { status: "DRAFT", generatedAt: new Date(), notes: aiResult.notes },
    create: { year, month, status: "DRAFT", generatedAt: new Date(), notes: aiResult.notes },
  });

  // Delete old assignments and insert new ones
  await prisma.shiftAssignment.deleteMany({ where: { scheduleId: schedule.id } });

  if (aiResult.assignments.length > 0) {
    await prisma.shiftAssignment.createMany({
      data: aiResult.assignments.map((a) => ({
        scheduleId: schedule.id,
        assistantId: a.assistantId,
        clinicSessionId: a.clinicSessionId,
        role: a.role,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    scheduleId: schedule.id,
    assignmentCount: aiResult.assignments.length,
    notes: aiResult.notes,
  });
}
