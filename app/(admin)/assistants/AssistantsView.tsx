"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Assistant {
  id: string;
  skills: string[] | string;
  isActive: boolean;
  isTraining: boolean;
  notes: string | null;
  preferences: string | null;
  user: { id: string; name: string; email: string };
}

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
}

interface Props {
  assistants: Assistant[];
  doctors: Doctor[];
}

function parseSkills(skills: string[] | string): string[] {
  if (Array.isArray(skills)) return skills;
  try { return JSON.parse(skills); } catch { return []; }
}

function parsePrefs(raw: string | null): { preferredDoctorIds: string[] } {
  try {
    const parsed = JSON.parse(raw ?? "{}");
    return { preferredDoctorIds: [], ...parsed };
  } catch { return { preferredDoctorIds: [] }; }
}

const SKILL_OPTIONS = [
  { value: "counter", label: "櫃檯" },
  { value: "mobile", label: "機動" },
  { value: "teaching", label: "教學" },
  { value: "orthodontics", label: "矯正" },
  { value: "periodontics", label: "牙周" },
  { value: "microscope", label: "顯微" },
  { value: "pediatric", label: "兒牙" },
  { value: "oral_surgery", label: "口外" },
];

const SKILL_COLORS: Record<string, string> = {
  counter: "var(--mist-100)",
  mobile: "var(--clay-100)",
  teaching: "var(--sage-100)",
  orthodontics: "var(--rose-100)",
  periodontics: "var(--clay-100)",
  microscope: "var(--mist-100)",
  pediatric: "var(--rose-100)",
  oral_surgery: "var(--sage-100)",
};
const SKILL_TEXT: Record<string, string> = {
  counter: "var(--mist-700)",
  mobile: "var(--clay-700)",
  teaching: "var(--sage-700)",
  orthodontics: "var(--rose-700)",
  periodontics: "var(--clay-700)",
  microscope: "var(--mist-700)",
  pediatric: "var(--rose-700)",
  oral_surgery: "var(--sage-700)",
};
const SKILL_LABELS: Record<string, string> = {
  counter: "櫃檯", mobile: "機動", teaching: "教學",
  orthodontics: "矯正", periodontics: "牙周", microscope: "顯微",
  pediatric: "兒牙", oral_surgery: "口外",
};

export default function AssistantsView({ assistants, doctors }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState<string[]>(["counter", "mobile"]);
  const [isTraining, setIsTraining] = useState(false);
  const [notes, setNotes] = useState("");
  const [preferredDoctors, setPreferredDoctors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function openNew() {
    setEditId(null);
    setName(""); setEmail(""); setPassword("");
    setSkills(["counter", "mobile"]); setIsTraining(false); setNotes("");
    setPreferredDoctors([]);
    setShowForm(true);
  }

  function toggleSkill(skill: string) {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  }

  function toggleDoctor(id: string) {
    setPreferredDoctors((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const preferences = JSON.stringify({ preferredDoctorIds: preferredDoctors });

    if (editId) {
      await fetch(`/api/assistants/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, skills, notes, isTraining, preferences }),
      });
    } else {
      await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, skills, notes, isTraining, preferences }),
      });
    }
    setSubmitting(false);
    setShowForm(false);
    router.refresh();
  }

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>助理管理</h1>
          <p style={subStyle}>共 {assistants.length} 位助理</p>
        </div>
        <button onClick={openNew} style={primaryBtnStyle}>新增助理</button>
      </div>

      {showForm && (
        <div style={formCardStyle}>
          <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>
            {editId ? "編輯助理資料" : "新增助理帳號"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

            {/* Teaching status */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div
                  onClick={() => setIsTraining((v) => !v)}
                  style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    border: isTraining ? "2px solid var(--clay-500)" : "1.5px solid var(--border)",
                    background: isTraining ? "var(--clay-500)" : "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all .15s",
                  }}
                >
                  {isTraining && <span style={{ color: "white", fontSize: 13, lineHeight: 1 }}>✓</span>}
                </div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)" }}>教學中</span>
                  <span style={{ fontSize: 12.5, color: "var(--fg3)", marginLeft: 8 }}>
                    此助理目前在訓練期間，排班時須安排有教學技能的助理在旁
                  </span>
                </div>
              </label>
            </div>

            {/* Skills */}
            <div>
              <label style={labelStyle}>技能</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {SKILL_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => toggleSkill(opt.value)} style={{
                    height: 30, padding: "0 12px", borderRadius: "var(--radius-full)",
                    border: skills.includes(opt.value) ? `2px solid ${SKILL_TEXT[opt.value]}` : "1.5px solid var(--border)",
                    background: skills.includes(opt.value) ? SKILL_COLORS[opt.value] : "transparent",
                    color: skills.includes(opt.value) ? SKILL_TEXT[opt.value] : "var(--fg3)",
                    fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Preferred doctors */}
            <div>
              <label style={labelStyle}>偏好跟診醫師</label>
              <p style={{ fontSize: 12.5, color: "var(--fg3)", margin: "0 0 8px" }}>
                AI 排班時會優先將此助理排給這些醫師
              </p>
              {doctors.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--fg3)" }}>尚未建立醫師資料</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {doctors.map((doc) => {
                    const selected = preferredDoctors.includes(doc.id);
                    return (
                      <button key={doc.id} type="button" onClick={() => toggleDoctor(doc.id)} style={{
                        height: 30, padding: "0 12px", borderRadius: "var(--radius-full)",
                        border: selected ? "2px solid var(--mist-500)" : "1.5px solid var(--border)",
                        background: selected ? "var(--mist-100)" : "transparent",
                        color: selected ? "var(--mist-700)" : "var(--fg3)",
                        fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                      }}>
                        {selected && "✓ "}{doc.name}{doc.specialty ? ` (${doc.specialty})` : ""}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>備注</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} placeholder="其他備注" />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" disabled={submitting} style={primaryBtnStyle}>{submitting ? "儲存中..." : "儲存"}</button>
              <button type="button" onClick={() => setShowForm(false)} style={ghostBtnStyle}>取消</button>
            </div>
          </form>
        </div>
      )}

      {assistants.length === 0 ? (
        <div style={emptyStyle}>尚未新增任何助理</div>
      ) : (
        <div style={tableCardStyle}>
          {assistants.map((ast, idx) => {
            const skillList = parseSkills(ast.skills);
            const prefs = parsePrefs(ast.preferences);
            const prefDocNames = prefs.preferredDoctorIds
              .map((id) => doctors.find((d) => d.id === id)?.name)
              .filter(Boolean);

            return (
              <div key={ast.id} style={{
                display: "flex", alignItems: "center", padding: "14px 20px",
                borderBottom: idx < assistants.length - 1 ? "1px solid var(--border)" : "none", gap: 12,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--sage-100)", color: "var(--sage-700)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {ast.user.name.slice(-2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)" }}>{ast.user.name}</span>
                    {ast.isTraining && (
                      <span style={{ padding: "1px 8px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, background: "var(--clay-100)", color: "var(--clay-700)" }}>
                        教學中
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 1 }}>{ast.user.email}</div>
                  {prefDocNames.length > 0 && (
                    <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 2 }}>
                      偏好：{prefDocNames.join("、")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 200 }}>
                  {skillList.map((skill) => (
                    <span key={skill} style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 600, background: SKILL_COLORS[skill] ?? "var(--neutral-100)", color: SKILL_TEXT[skill] ?? "var(--fg2)" }}>
                      {SKILL_LABELS[skill] ?? skill}
                    </span>
                  ))}
                </div>
                <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600, background: ast.isActive ? "var(--success-soft)" : "var(--neutral-100)", color: ast.isActive ? "var(--success)" : "var(--fg3)", flexShrink: 0 }}>
                  {ast.isActive ? "在職" : "停用"}
                </span>
                <button onClick={() => {
                  setEditId(ast.id);
                  setName(ast.user.name);
                  setSkills(parseSkills(ast.skills));
                  setIsTraining(ast.isTraining ?? false);
                  setNotes(ast.notes ?? "");
                  setPreferredDoctors(parsePrefs(ast.preferences).preferredDoctorIds ?? []);
                  setShowForm(true);
                }} style={editBtnStyle}>編輯</button>
              </div>
            );
          })}
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
