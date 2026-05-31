import { prisma } from "@/lib/prisma";
import AssistantsView from "./AssistantsView";

export default async function AssistantsPage() {
  const assistants = await prisma.assistant.findMany({
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return <AssistantsView assistants={assistants} />;
}
