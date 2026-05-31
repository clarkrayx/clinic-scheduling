import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "MANAGER"
  ) {
    redirect("/schedule");
  }

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: "總管理者",
    MANAGER: "人事主管",
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        userName={session.user.name ?? "管理者"}
        userRole={ROLE_LABELS[session.user.role ?? "MANAGER"] ?? "人事主管"}
        isAdmin={true}
        assistantId={null}
      />
      <main
        style={{
          flex: 1,
          overflow: "auto",
          background: "var(--bg)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
