import { prisma } from "@/lib/prisma";
import AssistantsView from "./AssistantsView";

export default async function AssistantsPage() {
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

  return <AssistantsView assistants={assistants} doctors={doctors} />;
}
