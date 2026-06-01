"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssistantRow {
  id: string;
  name: string;
  sessions: number;
  leaveSessions: number;
  leaveReasons: string[];
}

interface Props {
  year: number;
  month: number;
  assistants: AssistantRow[];
}

export default function SessionQuotaView({ year, month, assistants }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(assistants.map((a) => [a.id, a.sessions]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/session-quota?year=${y}&month=${m}`);
  }

  async function saveQuota(assistantId: string) {
    setSaving(assistantId);
    await fetch("/api/session-quota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assistantId, year, month, sessions: values[assistantId] ?? 0 }),
    });
    setSaving(null);
    setSavedIds((prev) => new Set([...prev, assistantId]));
    setTimeout(() => setSavedIds((prev) => { const next = new Set(prev); next.delete(assistantId); return next; }), 2000);
  }

  async function saveAll() {
    setSaving("all");
    await Promise.all(
      assistants.map((a) =>
        fetch("/api/session-quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assistantId: a.id, year, month, sessions: values[a.id] ?? 0 }),
        })
      )
    );
    setSaving(null);
    router.refresh();
  }

  const totalSessions = Object.values(values).reduce((s, v) => s + v, 0);

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0 }}>診次設定</h1>
          <p style={{ fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" }}>
            設定每位助理當月應排診次數，AI 排班時將嚴格遵守此設定
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={navBtnStyle}>‹</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg1)", minWidth: 90, textAlign: "center" }}>{year} 年 {month} 月</span>
          <button onClick={() => navigate(1)} style={navBtnStyle}>›</button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ padding: "12px 18px", background: "var(--brand-soft)", borderRadius: "var(--radius-md)", marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13.5, color: "var(--sage-700)", fontWeight: 600 }}>
        <span>本月總診次：<strong>{totalSessions}</strong> 診</span>
        <span>助理人數：{assistants.length} 人</span>
        <span>平均：{assistants.length > 0 ? (totalSessions / assistants.length).toFixed(1) : 0} 診/人</span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 20 }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 1fr 80px", gap: 0, padding: "12px 20px", background: "#f8f8f5", borderBottom: "1px solid var(--border)", fontSize: 12.5, fontWeight: 700, color: "var(--fg3)" }}>
          <span>助理姓名</span>
          <span style={{ textAlign: "center" }}>當月診次</span>
          <span style={{ textAlign: "center" }}>劃假診次</span>
          <span>劃假理由</span>
          <span></span>
        </div>

        {assistants.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--fg3)" }}>尚無在職助理</div>
        ) : (
          assistants.map((ast, idx) => (
            <div key={ast.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 1fr 80px", gap: 0, padding: "14px 20px", borderBottom: idx < assistants.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--sage-100)", color: "var(--sage-700)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {ast.name.slice(-2)}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)" }}>{ast.name}</span>
              </div>

              {/* Sessions input */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={values[ast.id] ?? 0}
                  onChange={(e) => setValues((prev) => ({ ...prev, [ast.id]: parseInt(e.target.value) || 0 }))}
                  style={{ width: 70, height: 36, textAlign: "center", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 15, fontWeight: 600, color: "var(--fg1)", outline: "none" }}
                />
                <span style={{ fontSize: 13, color: "var(--fg3)", marginLeft: 5, alignSelf: "center" }}>診</span>
              </div>

              {/* Leave sessions */}
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: ast.leaveSessions > 0 ? "var(--rose-600)" : "var(--fg3)" }}>
                  {ast.leaveSessions} 診
                </span>
              </div>

              {/* Leave reasons */}
              <div style={{ fontSize: 12.5, color: "var(--fg3)", lineHeight: 1.5, overflow: "hidden" }}>
                {ast.leaveReasons.length > 0 ? (
                  <span title={ast.leaveReasons.join("、")}>
                    {ast.leaveReasons.slice(0, 2).join("、")}
                    {ast.leaveReasons.length > 2 && "…"}
                  </span>
                ) : "—"}
              </div>

              {/* Save button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => saveQuota(ast.id)}
                  disabled={saving !== null}
                  style={{
                    height: 30, padding: "0 12px", borderRadius: "var(--radius-sm)",
                    background: savedIds.has(ast.id) ? "var(--success-soft)" : "var(--sage-500)",
                    color: savedIds.has(ast.id) ? "var(--success)" : "white",
                    border: "none", fontSize: 12.5, fontWeight: 600,
                    cursor: saving !== null ? "wait" : "pointer", transition: "all .2s",
                  }}
                >
                  {saving === ast.id ? "…" : savedIds.has(ast.id) ? "✓ 已存" : "儲存"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save all button */}
      {assistants.length > 0 && (
        <button
          onClick={saveAll}
          disabled={saving !== null}
          style={{ height: 42, padding: "0 24px", borderRadius: "var(--radius-md)", background: "var(--sage-500)", color: "white", border: "none", fontSize: 14.5, fontWeight: 600, cursor: saving !== null ? "wait" : "pointer" }}
        >
          {saving === "all" ? "儲存中…" : "一鍵儲存全部"}
        </button>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-raised)", cursor: "pointer", color: "var(--fg2)", fontSize: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" };
