import { prisma } from "@/lib/prisma";
import SessionQuotaView from "./SessionQuotaView";

export default async function SessionQuotaPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()));
  const month = parseInt(params.month ?? String(now.getMonth() + 1));

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const [assistants, quotas, preferenceDays] = await Promise.all([
    prisma.assistant.findMany({
      where: { isActive: true },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.monthlySessionQuota.findMany({
      where: { year, month },
    }),
    prisma.preferenceDay.findMany({
      where: { year, month },
      include: { assistant: { include: { user: true } } },
    }),
  ]);

  const quotaMap = Object.fromEntries(quotas.map((q) => [q.assistantId, q.sessions]));

  // Count leave days per assistant (unique dates)
  const leaveDatesMap: Record<string, Set<string>> = {};
  const leaveReasonsMap: Record<string, string[]> = {};
  for (const p of preferenceDays) {
    const dateStr = p.date instanceof Date ? p.date.toISOString().slice(0, 10) : String(p.date).slice(0, 10);
    if (!leaveDatesMap[p.assistantId]) leaveDatesMap[p.assistantId] = new Set();
    leaveDatesMap[p.assistantId].add(dateStr);
    if (!leaveReasonsMap[p.assistantId]) leaveReasonsMap[p.assistantId] = [];
    if (p.reason) leaveReasonsMap[p.assistantId].push(p.reason);
  }

  return (
    <SessionQuotaView
      year={year}
      month={month}
      assistants={assistants.map((a) => ({
        id: a.id,
        name: a.user.name,
        sessions: quotaMap[a.id] ?? 0,
        leaveSessions: preferenceDays.filter(p => p.assistantId === a.id).length,
        leaveReasons: leaveReasonsMap[a.id] ?? [],
      }))}
    />
  );
}
