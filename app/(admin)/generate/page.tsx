import { prisma } from "@/lib/prisma";
import GenerateView from "./GenerateView";

export default async function GeneratePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const assistants = await prisma.assistant.findMany({
    where: { isActive: true },
    include: { user: true },
  });

  const specialRules = await prisma.specialRule.findMany({
    where: { isActive: true },
  });

  return (
    <GenerateView
      defaultYear={year}
      defaultMonth={month}
      assistantCount={assistants.length}
      ruleCount={specialRules.length}
    />
  );
}
