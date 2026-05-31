"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Assistant {
  id: string;
  skills: string[];
  isActive: boolean;
  notes: string | null;
  user: { id: string; name: string; email: string };
}

const SKILL_OPTIONS = [
  { value: "counter", label: "櫃檯" },
  { value: "mobile", label: "機動" },
  { value: "dental", label: "牙科助理" },
];

const SKILL_COLORS: Record<string, string> = {
  counter: "var(--mist-100)",
  mobile: "var(--clay-100)",
  dental: "var(--sage-100)",
};
const SKILL_TEXT: Record<string, string> = {
  counter: "var(--mist-700)",
  mobile: "var(--clay-700)",
  dental: "var(--sage-700)",
};
const SKILL_LABELS: Record<string, string> = {
  counter: "櫃檯",
  mobile: "機動",
  dental: "牙科助理",
};

export default function AssistantsView({ assistants }: { assistants: Assistant[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState<string[]>(["counter", "mobile"]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openNew() {
    setEditId(null);
    setName("");
    setEmail("");
    setPassword("");
    setSkills(["counter", "mobile"]);
    setNotes("");
    setShowForm(true);
  }

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    if (editId) {
      await fetch(`/api/assistants/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, skills, notes }),
      });
    } else {
      await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, skills, notes }),
      });
    }
    setSubmitting(false);
    setShowForm(false);
    router.refresh();
  }

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>助理管理</h1>
          <p style={subStyle}>共 {assistants.length} 位助理</p>
        </div>
        <button onClick={openNew} style={primaryBtnStyle}>
          新增助理
        </button>
      </div>

      {showForm && (
        <div style={formCardStyle}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
            {editId ? "編輯助理" : "新增助理帳號"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>姓名 *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="助理姓名" />
              </div>
              {!editId && (
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="登入帳號" />
                </div>
              )}
            </div>
            {!editId && (
              <div>
                <label style={labelStyle}>初始密碼 *</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder="至少 8 個字元" minLength={8} />
              </div>
            )}
            <div>
              <label style={labelStyle}>技能</label>
              <div style={{ display: "flex", gap: 8 }}>
                {SKILL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleSkill(opt.value)}
                    style={{
                      height: 32,
                      padding: "0 14px",
                      borderRadius: "var(--radius-full)",
                      border: skills.includes(opt.value) ? "2px solid var(--sage-400)" : "1.5px solid var(--border)",
                      background: skills.includes(opt.value) ? "var(--sage-100)" : "transparent",
                      color: skills.includes(opt.value) ? "var(--sage-700)" : "var(--fg3)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>備注</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} placeholder="其他備注" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" disabled={submitting} style={primaryBtnStyle}>
                {submitting ? "儲存中..." : "儲存"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={ghostBtnStyle}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {assistants.length === 0 ? (
        <div style={emptyStyle}>尚未新增任何助理</div>
      ) : (
        <div style={tableCardStyle}>
          {assistants.map((ast, idx) => (
            <div
              key={ast.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: idx < assistants.length - 1 ? "1px solid var(--border)" : "none",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "var(--sage-100)",
                  color: "var(--sage-700)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {ast.user.name.slice(-2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg1)" }}>
                  {ast.user.name}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 1 }}>
                  {ast.user.email}
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {ast.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      padding: "2px 9px",
                      borderRadius: "var(--radius-full)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      background: SKILL_COLORS[skill] ?? "var(--neutral-100)",
                      color: SKILL_TEXT[skill] ?? "var(--fg2)",
                    }}
                  >
                    {SKILL_LABELS[skill] ?? skill}
                  </span>
                ))}
              </div>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 12,
                  fontWeight: 600,
                  background: ast.isActive ? "var(--success-soft)" : "var(--neutral-100)",
                  color: ast.isActive ? "var(--success)" : "var(--fg3)",
                }}
              >
                {ast.isActive ? "在職" : "停用"}
              </span>
              <button
                onClick={() => {
                  setEditId(ast.id);
                  setName(ast.user.name);
                  setSkills(ast.skills);
                  setNotes(ast.notes ?? "");
                  setShowForm(true);
                }}
                style={editBtnStyle}
              >
                編輯
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const h1Style: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0 };
const subStyle: React.CSSProperties = { fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" };
const primaryBtnStyle: React.CSSProperties = { height: 38, padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--sage-500)", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const ghostBtnStyle: React.CSSProperties = { height: 38, padding: "0 16px", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--fg2)", border: "1px solid var(--border)", fontSize: 14, cursor: "pointer" };
const editBtnStyle: React.CSSProperties = { height: 30, padding: "0 12px", borderRadius: "var(--radius-sm)", background: "var(--neutral-100)", color: "var(--fg2)", border: "1px solid var(--border)", fontSize: 12.5, cursor: "pointer" };
const formCardStyle: React.CSSProperties = { padding: "20px 24px", borderRadius: "var(--radius-lg)", background: "var(--bg-raised)", border: "1px solid var(--border)", marginBottom: 20 };
const tableCardStyle: React.CSSProperties = { background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" };
const emptyStyle: React.CSSProperties = { padding: "60px 20px", textAlign: "center", color: "var(--fg3)", fontSize: 15 };
const rowStyle: React.CSSProperties = { display: "flex", gap: 12 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", outline: "none" };
