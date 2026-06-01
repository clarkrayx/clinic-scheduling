import { prisma } from "@/lib/prisma";
import PreferenceOverviewView from "./PreferenceOverviewView";

export default async function PreferenceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  let defaultYear = now.getFullYear();
  let defaultMonth = now.getMonth() + 2;
  if (defaultMonth > 12) { defaultMonth = 1; defaultYear++; }

  const year = parseInt(params.year ?? String(defaultYear));
  const month = parseInt(params.month ?? String(defaultMonth));

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const [assistants, preferenceDays] = await Promise.all([
    prisma.assistant.findMany({
      where: { isActive: true },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.preferenceDay.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { assistant: { include: { user: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <PreferenceOverviewView
      year={year}
      month={month}
      assistants={assistants.map((a) => ({ id: a.id, name: a.user.name }))}
      preferenceDays={preferenceDays.map((p) => ({
        assistantId: p.assistantId,
        assistantName: p.assistant.user.name,
        date: p.date,
        sessionType: p.sessionType,
        reason: p.reason,
      }))}
    />
  );
}
