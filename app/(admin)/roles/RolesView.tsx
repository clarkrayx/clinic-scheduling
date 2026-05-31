"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isAssistantActive: boolean | null;
}

interface Props {
  users: User[];
  currentUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "系統管理者",
  MANAGER: "人事主管",
  ASSISTANT: "助理",
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: "var(--sage-100)", color: "var(--sage-700)" },
  MANAGER: { bg: "var(--mist-100, #e8f0f5)", color: "var(--mist-700, #2a6080)" },
  ASSISTANT: { bg: "var(--neutral-100)", color: "var(--fg3)" },
};

const PERMISSIONS: {
  label: string;
  admin: boolean;
  manager: boolean;
  assistant: boolean;
}[] = [
  { label: "查看自己的排班", admin: true, manager: true, assistant: true },
  { label: "劃假月曆（標記希望休假）", admin: false, manager: false, assistant: true },
  { label: "查看所有助理排班", admin: true, manager: true, assistant: false },
  { label: "設定開診日與診次", admin: true, manager: true, assistant: false },
  { label: "查看助理劃假總覽", admin: true, manager: true, assistant: false },
  { label: "設定排班規則", admin: true, manager: true, assistant: false },
  { label: "AI 自動排班 / 發布班表", admin: true, manager: true, assistant: false },
  { label: "刪除班表", admin: true, manager: true, assistant: false },
  { label: "管理醫師資料", admin: true, manager: true, assistant: false },
  { label: "查看助理帳號", admin: true, manager: true, assistant: false },
  { label: "新增 / 編輯助理帳號", admin: true, manager: true, assistant: false },
  { label: "停用助理帳號", admin: true, manager: true, assistant: false },
  { label: "重設任意帳號密碼", admin: true, manager: true, assistant: false },
  { label: "刪除帳號（永久）", admin: true, manager: false, assistant: false },
  { label: "管理角色與權限", admin: true, manager: false, assistant: false },
];

export default function RolesView({ users, currentUserId }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  async function changeRole(userId: string, role: string) {
    setUpdating(userId);
    await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setUpdating(null);
    router.refresh();
  }

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 960 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: "0 0 6px" }}>
        角色與權限管理
      </h1>
      <p style={{ fontSize: 14, color: "var(--fg3)", margin: "0 0 32px" }}>
        設定人事主管，並查看各角色的系統權限。
      </p>

      {/* Permission matrix */}
      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 36 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--fg1)" }}>權限對照表</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#f8f8f5" }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: 600, color: "var(--fg2)", borderBottom: "1px solid var(--border)", width: "55%" }}>
                  功能 / 權限
                </th>
                {["ADMIN", "MANAGER", "ASSISTANT"].map((role) => (
                  <th key={role} style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, borderBottom: "1px solid var(--border)", color: ROLE_COLORS[role].color }}>
                    <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", background: ROLE_COLORS[role].bg, fontSize: 12 }}>
                      {ROLE_LABELS[role]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p, i) => (
                <tr key={i} style={{ borderBottom: i < PERMISSIONS.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "transparent" : "#fafaf8" }}>
                  <td style={{ padding: "11px 20px", color: "var(--fg2)" }}>{p.label}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center" }}>
                    {p.admin ? <CheckIcon /> : <XIcon />}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "center" }}>
                    {p.manager ? <CheckIcon /> : <XIcon />}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "center" }}>
                    {p.assistant ? <CheckIcon /> : <XIcon />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User role assignment */}
      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--fg1)" }}>使用者角色設定</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--fg3)" }}>
            系統管理者角色無法在此修改。只有系統管理者可以指派人事主管。
          </p>
        </div>

        {users.map((user, idx) => {
          const isSelf = user.id === currentUserId;
          const isAdmin = user.role === "ADMIN";
          const isPending = user.isAssistantActive === false;

          return (
            <div
              key={user.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 20px",
                borderBottom: idx < users.length - 1 ? "1px solid var(--border)" : "none",
                opacity: isSelf || isAdmin ? 0.75 : 1,
              }}
            >
              {/* Avatar */}
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: ROLE_COLORS[user.role].bg, color: ROLE_COLORS[user.role].color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {user.name.slice(-2)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)" }}>{user.name}</span>
                  {isSelf && <span style={{ fontSize: 11, color: "var(--fg3)" }}>(您)</span>}
                  {isPending && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "#fff3e0", color: "#b06000" }}>
                      待審核
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 1 }}>{user.email}</div>
              </div>

              {/* Role badge / selector */}
              {isAdmin || isSelf ? (
                <span style={{ padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: 12.5, fontWeight: 600, background: ROLE_COLORS[user.role].bg, color: ROLE_COLORS[user.role].color, flexShrink: 0 }}>
                  {ROLE_LABELS[user.role]}
                </span>
              ) : (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {["MANAGER", "ASSISTANT"].map((role) => (
                    <button
                      key={role}
                      disabled={updating === user.id || user.role === role}
                      onClick={() => changeRole(user.id, role)}
                      style={{
                        height: 30, padding: "0 12px", borderRadius: "var(--radius-sm)",
                        border: user.role === role ? `2px solid ${ROLE_COLORS[role].color}` : "1.5px solid var(--border)",
                        background: user.role === role ? ROLE_COLORS[role].bg : "transparent",
                        color: user.role === role ? ROLE_COLORS[role].color : "var(--fg3)",
                        fontSize: 12, fontWeight: 600,
                        cursor: user.role === role ? "default" : "pointer",
                        transition: "all .15s",
                      }}
                    >
                      {updating === user.id ? "…" : ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return <span style={{ color: "var(--success, #4a8c5c)", fontSize: 16, fontWeight: 700 }}>✓</span>;
}

function XIcon() {
  return <span style={{ color: "var(--fg3)", fontSize: 14 }}>–</span>;
}
