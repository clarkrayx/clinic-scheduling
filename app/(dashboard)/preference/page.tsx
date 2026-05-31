import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PreferenceView from "./PreferenceView";

export default async function PreferencePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  // 預設顯示下個月（排班通常排下個月）
  let defaultYear = now.getFullYear();
  let defaultMonth = now.getMonth() + 2;
  if (defaultMonth > 12) { defaultMonth = 1; defaultYear++; }

  const year = parseInt(params.year ?? String(defaultYear));
  const month = parseInt(params.month ?? String(defaultMonth));

  // 找出此使用者的 assistant 記錄
  const assistant = await prisma.assistant.findUnique({
    where: { userId: session.user.id },
  });

  if (!assistant) {
    return (
      <div style={{ padding: "60px 32px", textAlign: "center", color: "var(--fg3)" }}>
        此帳號不是助理，無法使用畫假功能。
      </div>
    );
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const preferenceDays = await prisma.preferenceDay.findMany({
    where: {
      assistantId: assistant.id,
      date: { gte: startDate, lte: endDate },
    },
  });

  return (
    <PreferenceView
      year={year}
      month={month}
      assistantId={assistant.id}
      preferenceDays={preferenceDays.map((p) => ({
        date: p.date,
        reason: p.reason,
      }))}
    />
  );
}
