import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "總管理者",
  MANAGER: "人事主管",
  ASSISTANT: "助理",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MANAGER";

  let assistantId: string | null = null;
  if (!isAdmin) {
    const assistant = await prisma.assistant.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    assistantId = assistant?.id ?? null;
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        userName={session.user.name ?? "使用者"}
        userRole={ROLE_LABELS[session.user.role ?? "ASSISTANT"] ?? "助理"}
        isAdmin={isAdmin}
        assistantId={assistantId}
      />
      <main
        style={{
          flex: 1,
          overflow: "auto",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
    </div>
  );
}
