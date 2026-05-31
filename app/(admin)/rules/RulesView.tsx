"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rule {
  id: string;
  title: string;
  description: string;
  ruleType: string;
  isActive: boolean;
}

const RULE_TYPES = [
  { value: "max_sessions_per_day", label: "每日最多診次" },
  { value: "max_consecutive_days", label: "最多連續上班天數" },
  { value: "min_days_off_per_week", label: "每週最少休息天數" },
  { value: "avoid_same_assistant_twice", label: "避免同診次排同一人" },
  { value: "prefer_same_doctor", label: "固定搭配醫師" },
  { value: "custom", label: "自訂規則" },
];

export default function RulesView({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState("max_sessions_per_day");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, ruleType, config: "{}" }),
    });
    setSubmitting(false);
    setShowForm(false);
    setTitle("");
    setDescription("");
    router.refresh();
  }

  async function toggleRule(id: string, isActive: boolean) {
    await fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function deleteRule(id: string) {
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>排班規則</h1>
          <p style={subStyle}>共 {rules.length} 條規則（{rules.filter((r) => r.isActive).length} 條啟用中）</p>
        </div>
        <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>新增規則</button>
      </div>

      {showForm && (
        <div style={formCardStyle}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>新增排班規則</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>規則名稱 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} placeholder="例：每日最多 2 診" />
            </div>
            <div>
              <label style={labelStyle}>規則類型</label>
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value)} style={selectStyle}>
                {RULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>說明 *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }} placeholder="請詳細描述規則內容，AI 排班時會參考此說明" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" disabled={submitting} style={primaryBtnStyle}>{submitting ? "儲存中..." : "新增"}</button>
              <button type="button" onClick={() => setShowForm(false)} style={ghostBtnStyle}>取消</button>
            </div>
          </form>
        </div>
      )}

      {rules.length === 0 ? (
        <div style={emptyStyle}>尚未設定排班規則，建議先設定基本規則再進行自動排班。</div>
      ) : (
        <div style={tableCardStyle}>
          {rules.map((rule, idx) => (
            <div key={rule.id} style={{ display: "flex", alignItems: "flex-start", padding: "16px 20px", borderBottom: idx < rules.length - 1 ? "1px solid var(--border)" : "none", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: rule.isActive ? "var(--fg1)" : "var(--fg3)" }}>{rule.title}</span>
                  <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: 11.5, fontWeight: 600, background: "var(--neutral-100)", color: "var(--fg3)" }}>
                    {RULE_TYPES.find((t) => t.value === rule.ruleType)?.label ?? rule.ruleType}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--fg3)", margin: 0, lineHeight: 1.5 }}>{rule.description}</p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600, background: rule.isActive ? "var(--success-soft)" : "var(--neutral-100)", color: rule.isActive ? "var(--success)" : "var(--fg3)", cursor: "pointer" }} onClick={() => toggleRule(rule.id, rule.isActive)}>
                  {rule.isActive ? "啟用" : "停用"}
                </span>
                <button onClick={() => deleteRule(rule.id)} style={{ height: 28, padding: "0 10px", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--danger)", border: "1px solid var(--rose-300)", fontSize: 12, cursor: "pointer" }}>刪除</button>
              </div>
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
const formCardStyle: React.CSSProperties = { padding: "20px 24px", borderRadius: "var(--radius-lg)", background: "var(--bg-raised)", border: "1px solid var(--border)", marginBottom: 20 };
const tableCardStyle: React.CSSProperties = { background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" };
const emptyStyle: React.CSSProperties = { padding: "60px 20px", textAlign: "center", color: "var(--fg3)", fontSize: 15 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", outline: "none" };
const selectStyle: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", cursor: "pointer", outline: "none" };
