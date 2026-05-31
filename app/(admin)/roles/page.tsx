import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import RolesView from "./RolesView";

export default async function RolesPage() {
  const session = await auth();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      assistant: { select: { isActive: true } },
    },
  });

  return (
    <RolesView
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        isAssistantActive: u.assistant?.isActive ?? null,
      }))}
      currentUserId={session?.user?.id ?? ""}
    />
  );
}
