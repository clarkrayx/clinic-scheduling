import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import AssistantsView from "./AssistantsView";

export default async function AssistantsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [assistants, doctors] = await Promise.all([
    prisma.assistant.findMany({
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.doctor.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <AssistantsView assistants={assistants} doctors={doctors} isAdmin={isAdmin} />;
}
