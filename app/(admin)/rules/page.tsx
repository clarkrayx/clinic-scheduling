import { prisma } from "@/lib/prisma";
import RulesView from "./RulesView";

export default async function RulesPage() {
  const rules = await prisma.specialRule.findMany({
    orderBy: { createdAt: "asc" },
  });
  return <RulesView rules={rules} />;
}
