"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssistantRow {
  id: string;
  name: string;
  sessions: number;
  leaveSessions: number;
}

interface Props {
  year: number;
  month: number;
  assistants: AssistantRow[];
}

export default function SessionQuotaView({ year, month, assistants }: Props) {
  const router = useRouter();

  // Global default sessions (top input)
  const defaultSessions = assistants.length > 0
    ? Math.round(assistants.reduce((s, a) => s + a.sessions, 0) / assistants.length) || 0
    : 0;
  const [globalSessions, setGlobalSessions] = useState(defaultSessions);

  // Per-assistant sessions (overrideable from global)
  const [sessions, setSessions] = useState<Record<string, number>>(
    Object.fromEntries(assistants.map((a) => [a.id, a.sessions]))
  );
  const [leaveValues, setLeaveValues] = useState<Record<string, number>>(
    Object.fromEntries(assistants.map((a) => [a.id, a.leaveSessions]))
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/session-quota?year=${y}&month=${m}`);
  }

  // When global sessions changes, update all assistant rows
  function handleGlobalChange(val: number) {
    setGlobalSessions(val);
    setSessions(Object.fromEntries(assistants.map((a) => [a.id, val])));
  }

  async function saveAll() {
    setSaving(true);
    await Promise.all(
      assistants.map((a) =>
        fetch("/api/session-quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assistantId: a.id, year, month,
            sessions: sessions[a.id] ?? 0,
            leaveSessions: leaveValues[a.id] ?? 0,
          }),
        })
      )
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  const totalSessions = Object.values(sessions).reduce((s, v) => s + v, 0);
  const totalLeave = Object.values(leaveValues).reduce((s, v) => s + v, 0);
  const totalActual = totalSessions - totalLeave;

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0 }}>
            診次設定
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" }}>
            設定每位助理當月診次，AI 排班將嚴格依「實際上班診次」安排
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={navBtnStyle}>‹</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg1)", minWidth: 90, textAlign: "center" }}>
            {year} 年 {month} 月
          </span>
          <button onClick={() => navigate(1)} style={navBtnStyle}>›</button>
        </div>
      </div>

      {/* Global sessions row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 20, padding: "16px 20px",
        background: "var(--sage-50, #f5f8f5)", borderRadius: "var(--radius-md)",
        border: "1.5px solid var(--sage-200)", marginBottom: 20,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--sage-700)", minWidth: 80 }}>當月診次</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number"
            min={0}
            max={60}
            value={globalSessions}
            onChange={(e) => handleGlobalChange(parseInt(e.target.value) || 0)}
            style={{ width: 80, height: 40, textAlign: "center", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--sage-400)", background: "white", fontSize: 18, fontWeight: 700, color: "var(--sage-700)", outline: "none" }}
          />
          <span style={{ fontSize: 14, color: "var(--sage-600)", fontWeight: 600 }}>診</span>
        </div>
        <span style={{ fontSize: 13, color: "var(--fg3)" }}>
          調整此數值將同步套用至所有助理（可個別調整）
        </span>
      </div>

      {/* Summary bar */}
      <div style={{ padding: "12px 18px", background: "var(--brand-soft)", borderRadius: "var(--radius-md)", marginBottom: 20, display: "flex", gap: 28, flexWrap: "wrap", fontSize: 13.5, color: "var(--sage-700)", fontWeight: 600 }}>
        <span>本月總診次：{totalSessions} 診</span>
        <span>合計請假：{totalLeave} 診</span>
        <span>合計實際上班：{totalActual} 診</span>
        <span style={{ color: "var(--fg3)", fontWeight: 400 }}>共 {assistants.length} 位助理</span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 20 }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 140px", padding: "12px 20px", background: "#f8f8f5", borderBottom: "1px solid var(--border)", fontSize: 12.5, fontWeight: 700, color: "var(--fg3)" }}>
          <span>助理姓名</span>
          <span style={{ textAlign: "center" }}>當月診次</span>
          <span style={{ textAlign: "center" }}>請假診次</span>
          <span style={{ textAlign: "center" }}>實際上班診次</span>
        </div>

        {assistants.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--fg3)" }}>尚無在職助理</div>
        ) : (
          assistants.map((ast, idx) => {
            const sessionVal = sessions[ast.id] ?? 0;
            const leaveVal = leaveValues[ast.id] ?? 0;
            const actual = Math.max(0, sessionVal - leaveVal);

            return (
              <div key={ast.id} style={{
                display: "grid", gridTemplateColumns: "1fr 140px 140px 140px",
                padding: "14px 20px", borderBottom: idx < assistants.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center",
              }}>
                {/* Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--sage-100)", color: "var(--sage-700)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {ast.name.slice(-2)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)" }}>{ast.name}</span>
                </div>

                {/* 當月診次 — individual override */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5 }}>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={sessionVal}
                    onChange={(e) => setSessions((prev) => ({ ...prev, [ast.id]: parseInt(e.target.value) || 0 }))}
                    style={{ width: 65, height: 36, textAlign: "center", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 15, fontWeight: 600, color: "var(--fg1)", outline: "none" }}
                  />
                  <span style={{ fontSize: 12, color: "var(--fg3)" }}>診</span>
                </div>

                {/* 請假診次 */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5 }}>
                  <input
                    type="number"
                    min={0}
                    max={sessionVal}
                    value={leaveVal}
                    onChange={(e) => setLeaveValues((prev) => ({ ...prev, [ast.id]: parseInt(e.target.value) || 0 }))}
                    style={{ width: 65, height: 36, textAlign: "center", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 15, fontWeight: 600, color: leaveVal > 0 ? "var(--rose-600)" : "var(--fg1)", outline: "none" }}
                    placeholder="0"
                  />
                  <span style={{ fontSize: 12, color: "var(--fg3)" }}>診</span>
                </div>

                {/* 實際上班診次 */}
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    fontSize: 18, fontWeight: 800, color: actual > 0 ? "var(--sage-600)" : "var(--fg3)",
                    fontFamily: "var(--font-display)",
                  }}>
                    {actual}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--fg3)", marginLeft: 3 }}>診</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save all */}
      {assistants.length > 0 && (
        <button
          onClick={saveAll}
          disabled={saving}
          style={{
            height: 44, padding: "0 28px", borderRadius: "var(--radius-md)",
            background: saved ? "var(--success-soft)" : saving ? "var(--sage-300)" : "var(--sage-500)",
            color: saved ? "var(--success)" : "white",
            border: "none", fontSize: 14.5, fontWeight: 600,
            cursor: saving ? "wait" : "pointer", transition: "all .2s",
          }}
        >
          {saving ? "儲存中…" : saved ? "✓ 已儲存" : "儲存全部診次設定"}
        </button>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-raised)", cursor: "pointer", color: "var(--fg2)", fontSize: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" };
