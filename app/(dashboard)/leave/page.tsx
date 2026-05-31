import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeaveView from "./LeaveView";

export default async function LeavePage() {
  const session = await auth();

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  let myAssistantId: string | null = null;
  if (!isAdmin && session?.user?.id) {
    const assistant = await prisma.assistant.findUnique({
      where: { userId: session.user.id },
    });
    myAssistantId = assistant?.id ?? null;
  }

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: isAdmin ? {} : { assistantId: myAssistantId ?? "" },
    include: { assistant: { include: { user: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <LeaveView
      leaveRequests={leaveRequests}
      isAdmin={isAdmin}
      myAssistantId={myAssistantId}
    />
  );
}
