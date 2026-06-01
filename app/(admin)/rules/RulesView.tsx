"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rule {
  id: string;
  title: string;
  description: string;
  ruleType: string;
  isActive: boolean;
  isMandatory: boolean;
}

const RULE_TYPES = [
  { value: "max_sessions_per_day", label: "每日最多診次" },
  { value: "max_consecutive_days", label: "最多連續上班天數" },
  { value: "min_days_off_per_week", label: "每週最少休息天數" },
  { value: "avoid_same_assistant_twice", label: "避免同診次排同一人" },
  { value: "prefer_same_doctor", label: "固定搭配醫師" },
  { value: "custom", label: "自訂規則" },
];

function RuleCard({ rule, onToggle, onDelete }: { rule: Rule; onToggle: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", padding: "16px 20px", borderBottom: "1px solid var(--border)", gap: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: rule.isActive ? "var(--fg1)" : "var(--fg3)" }}>{rule.title}</span>
          <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: 11.5, fontWeight: 600, background: "var(--neutral-100)", color: "var(--fg3)" }}>
            {RULE_TYPES.find((t) => t.value === rule.ruleType)?.label ?? rule.ruleType}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--fg3)", margin: 0, lineHeight: 1.5 }}>{rule.description}</p>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
        <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600, background: rule.isActive ? "var(--success-soft)" : "var(--neutral-100)", color: rule.isActive ? "var(--success)" : "var(--fg3)", cursor: "pointer" }} onClick={onToggle}>
          {rule.isActive ? "啟用" : "停用"}
        </span>
        <button onClick={onDelete} style={{ height: 28, padding: "0 10px", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--danger)", border: "1px solid var(--rose-300)", fontSize: 12, cursor: "pointer" }}>刪除</button>
      </div>
    </div>
  );
}

export default function RulesView({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formMandatory, setFormMandatory] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState("custom");
  const [submitting, setSubmitting] = useState(false);

  const mandatory = rules.filter((r) => r.isMandatory);
  const flexible = rules.filter((r) => !r.isMandatory);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, ruleType, config: "{}", isMandatory: formMandatory }),
    });
    setSubmitting(false);
    setShowForm(false);
    setTitle(""); setDescription(""); setRuleType("custom");
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
    if (!confirm("確定要刪除此規則嗎？")) return;
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function openForm(mandatory: boolean) {
    setFormMandatory(mandatory);
    setTitle(""); setDescription(""); setRuleType("custom");
    setShowForm(true);
  }

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 900 }}>
      <h1 style={h1Style}>排班規則</h1>
      <p style={subStyle}>設定 AI 排班時需遵守的規則，分為強制規則與通融規則。</p>

      {/* Add form */}
      {showForm && (
        <div style={formCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              新增{formMandatory ? "強制" : "通融"}規則
            </h3>
            <span style={{ padding: "2px 10px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 700, background: formMandatory ? "#fef0e8" : "#e8f5ed", color: formMandatory ? "#b06000" : "var(--success)" }}>
              {formMandatory ? "🔒 必須遵守" : "🤝 可通融"}
            </span>
          </div>
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
              <button type="submit" disabled={submitting} style={primaryBtnStyle}>{submitting ? "儲存中…" : "新增"}</button>
              <button type="button" onClick={() => setShowForm(false)} style={ghostBtnStyle}>取消</button>
            </div>
          </form>
        </div>
      )}

      {/* Section 1: Mandatory */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--fg1)" }}>強制規則</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--fg3)" }}>AI 排班時必須遵守，不得違反</p>
            </div>
          </div>
          <button onClick={() => openForm(true)} style={addBtnStyle("#b06000", "#fef0e8")}>＋ 新增強制規則</button>
        </div>
        <div style={tableCardStyle}>
          {mandatory.length === 0 ? (
            <div style={emptyStyle}>尚未設定強制規則</div>
          ) : (
            mandatory.map((rule) => (
              <RuleCard key={rule.id} rule={rule}
                onToggle={() => toggleRule(rule.id, rule.isActive)}
                onDelete={() => deleteRule(rule.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Section 2: Flexible */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🤝</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--fg1)" }}>通融規則</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--fg3)" }}>AI 排班時盡量遵守，人力不足時可視情況彈性處理</p>
            </div>
          </div>
          <button onClick={() => openForm(false)} style={addBtnStyle("var(--success)", "#e8f5ed")}>＋ 新增通融規則</button>
        </div>
        <div style={tableCardStyle}>
          {flexible.length === 0 ? (
            <div style={emptyStyle}>尚未設定通融規則</div>
          ) : (
            flexible.map((rule) => (
              <RuleCard key={rule.id} rule={rule}
                onToggle={() => toggleRule(rule.id, rule.isActive)}
                onDelete={() => deleteRule(rule.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function addBtnStyle(color: string, bg: string): React.CSSProperties {
  return { height: 34, padding: "0 14px", borderRadius: "var(--radius-md)", background: bg, color, border: `1.5px solid ${color}`, fontSize: 13, fontWeight: 600, cursor: "pointer" };
}

const h1Style: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: "0 0 6px" };
const subStyle: React.CSSProperties = { fontSize: 14, color: "var(--fg3)", margin: "0 0 24px" };
const primaryBtnStyle: React.CSSProperties = { height: 38, padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--sage-500)", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const ghostBtnStyle: React.CSSProperties = { height: 38, padding: "0 16px", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--fg2)", border: "1px solid var(--border)", fontSize: 14, cursor: "pointer" };
const formCardStyle: React.CSSProperties = { padding: "20px 24px", borderRadius: "var(--radius-lg)", background: "var(--bg-raised)", border: "1px solid var(--border)", marginBottom: 24 };
const tableCardStyle: React.CSSProperties = { background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" };
const emptyStyle: React.CSSProperties = { padding: "32px 20px", textAlign: "center", color: "var(--fg3)", fontSize: 14 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", outline: "none" };
const selectStyle: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", cursor: "pointer", outline: "none" };
