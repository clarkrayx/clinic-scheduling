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

  const [assistants, quotas] = await Promise.all([
    prisma.assistant.findMany({
      where: { isActive: true },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.monthlySessionQuota.findMany({
      where: { year, month },
    }),
  ]);

  const quotaMap = Object.fromEntries(quotas.map((q) => [q.assistantId, q]));

  return (
    <SessionQuotaView
      year={year}
      month={month}
      assistants={assistants.map((a) => ({
        id: a.id,
        name: a.user.name,
        sessions: quotaMap[a.id]?.sessions ?? 0,
        leaveSessions: quotaMap[a.id]?.leaveSessions ?? 0,
        leaveNote: quotaMap[a.id]?.leaveNote ?? "",
      }))}
    />
  );
}
