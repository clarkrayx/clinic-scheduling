import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ScheduleView from "./ScheduleView";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()));
  const month = parseInt(params.month ?? String(now.getMonth() + 1));

  const schedule = await prisma.schedule.findUnique({
    where: { year_month: { year, month } },
    include: {
      shiftAssignments: {
        include: {
          assistant: { include: { user: true } },
          clinicSession: { include: { clinicDay: true, doctor: true } },
        },
      },
    },
  });

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
  const currentUserId = session?.user?.id;

  // For assistants, find their assistant record
  let myAssistantId: string | null = null;
  if (!isAdmin && currentUserId) {
    const assistant = await prisma.assistant.findUnique({
      where: { userId: currentUserId },
    });
    myAssistantId = assistant?.id ?? null;
  }

  return (
    <ScheduleView
      year={year}
      month={month}
      schedule={schedule}
      isAdmin={isAdmin}
      myAssistantId={myAssistantId}
    />
  );
}
