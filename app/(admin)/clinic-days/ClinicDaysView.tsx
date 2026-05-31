"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClinicSession {
  id: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  counterNeeded: number;
  mobileNeeded: number;
  doctor: { id: string; name: string } | null;
}

interface ClinicDay {
  id: string;
  date: Date | string;
  isOpen: boolean;
  notes: string | null;
  sessions: ClinicSession[];
}

interface Doctor {
  id: string;
  name: string;
}

interface Props {
  year: number;
  month: number;
  clinicDays: ClinicDay[];
  doctors: Doctor[];
}

const SESSION_TYPES = [
  { value: "morning", label: "早診", defaultStart: "09:00", defaultEnd: "12:00" },
  { value: "afternoon", label: "午診", defaultStart: "14:00", defaultEnd: "17:00" },
  { value: "evening", label: "晚診", defaultStart: "18:00", defaultEnd: "21:00" },
];
const SESSION_LABELS: Record<string, string> = { morning: "早診", afternoon: "午診", evening: "晚診" };
const SESSION_COLORS: Record<string, string> = { morning: "var(--clay-300)", afternoon: "var(--mist-300)", evening: "var(--rose-300)" };
const SESSION_BG: Record<string, string> = { morning: "var(--clay-100)", afternoon: "var(--mist-100)", evening: "var(--rose-100)" };

export default function ClinicDaysView({ year, month, clinicDays, doctors }: Props) {
  const router = useRouter();
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [showAddSession, setShowAddSession] = useState<string | null>(null); // clinicDayId
  const [sessionType, setSessionType] = useState("morning");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [doctorId, setDoctorId] = useState("");
  const [counterNeeded, setCounterNeeded] = useState(4);
  const [mobileNeeded, setMobileNeeded] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/clinic-days?year=${y}&month=${m}`);
  }

  async function addClinicDay(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/clinic-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate }),
    });
    setSubmitting(false);
    setShowAddDay(false);
    setNewDate("");
    router.refresh();
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    if (!showAddSession) return;
    setSubmitting(true);
    await fetch("/api/clinic-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicDayId: showAddSession,
        sessionType,
        startTime,
        endTime,
        doctorId: doctorId || null,
        counterNeeded,
        mobileNeeded,
      }),
    });
    setSubmitting(false);
    setShowAddSession(null);
    router.refresh();
  }

  async function deleteSession(id: string) {
    await fetch(`/api/clinic-sessions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>開診設定</h1>
          <p style={subStyle}>{year} 年 {month} 月 · {clinicDays.length} 個診日</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={navBtnStyle}>‹</button>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg2)", minWidth: 72, textAlign: "center" }}>{month} 月</span>
          <button onClick={() => navigate(1)} style={navBtnStyle}>›</button>
          <button onClick={() => setShowAddDay(true)} style={primaryBtnStyle}>新增診日</button>
        </div>
      </div>

      {showAddDay && (
        <div style={formCardStyle}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>新增診日</h3>
          <form onSubmit={addClinicDay} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div>
              <label style={labelStyle}>日期 *</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required style={{ ...inputStyle, width: 180 }} min={`${year}-${String(month).padStart(2, "0")}-01`} max={`${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`} />
            </div>
            <button type="submit" disabled={submitting} style={primaryBtnStyle}>{submitting ? "儲存..." : "新增"}</button>
            <button type="button" onClick={() => setShowAddDay(false)} style={ghostBtnStyle}>取消</button>
          </form>
        </div>
      )}

      {clinicDays.length === 0 ? (
        <div style={emptyStyle}>本月尚未設定任何診日，請點擊「新增診日」開始設定。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clinicDays.map((day) => {
            const dateStr = String(day.date).slice(0, 10);
            const [, , d] = dateStr.split("-");
            return (
              <div key={day.id} style={{ background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: day.sessions.length > 0 ? "1px solid var(--border)" : "none", background: "var(--surface-tint)" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--fg1)" }}>{month} 月 {parseInt(d)} 日</div>
                  <div style={{ fontSize: 12.5, color: "var(--fg3)", marginLeft: 10 }}>{dateStr}</div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button onClick={() => { setShowAddSession(day.id); setSessionType("morning"); setStartTime("09:00"); setEndTime("12:00"); setDoctorId(""); setCounterNeeded(4); setMobileNeeded(4); }} style={smallBtnStyle}>新增診次</button>
                  </div>
                </div>

                {showAddSession === day.id && (
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                    <form onSubmit={addSession} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                      <div>
                        <label style={labelStyle}>診次 *</label>
                        <select value={sessionType} onChange={(e) => { const t = SESSION_TYPES.find(s => s.value === e.target.value); setSessionType(e.target.value); if (t) { setStartTime(t.defaultStart); setEndTime(t.defaultEnd); } }} style={selectStyle}>
                          {SESSION_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>開始</label>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ ...inputStyle, width: 110 }} />
                      </div>
                      <div>
                        <label style={labelStyle}>結束</label>
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ ...inputStyle, width: 110 }} />
                      </div>
                      <div>
                        <label style={labelStyle}>醫師</label>
                        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} style={selectStyle}>
                          <option value="">未指定</option>
                          {doctors.map((doc) => <option key={doc.id} value={doc.id}>{doc.name} 醫師</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>櫃檯人數</label>
                        <input type="number" min={0} max={10} value={counterNeeded} onChange={(e) => setCounterNeeded(parseInt(e.target.value))} style={{ ...inputStyle, width: 70 }} />
                      </div>
                      <div>
                        <label style={labelStyle}>機動人數</label>
                        <input type="number" min={0} max={10} value={mobileNeeded} onChange={(e) => setMobileNeeded(parseInt(e.target.value))} style={{ ...inputStyle, width: 70 }} />
                      </div>
                      <button type="submit" disabled={submitting} style={primaryBtnStyle}>{submitting ? "..." : "新增診次"}</button>
                      <button type="button" onClick={() => setShowAddSession(null)} style={ghostBtnStyle}>取消</button>
                    </form>
                  </div>
                )}

                {day.sessions.map((session) => (
                  <div key={session.id} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600, background: SESSION_BG[session.sessionType], color: SESSION_COLORS[session.sessionType].replace("300", "700") }}>
                      {SESSION_LABELS[session.sessionType]}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--fg2)" }}>{session.startTime} – {session.endTime}</span>
                    {session.doctor && <span style={{ fontSize: 13, color: "var(--fg2)" }}>{session.doctor.name} 醫師</span>}
                    <span style={{ fontSize: 12.5, color: "var(--fg3)" }}>櫃檯 {session.counterNeeded} · 機動 {session.mobileNeeded}</span>
                    <button onClick={() => deleteSession(session.id)} style={{ marginLeft: "auto", ...deleteBtnStyle }}>刪除</button>
                  </div>
                ))}
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
const smallBtnStyle: React.CSSProperties = { height: 30, padding: "0 12px", borderRadius: "var(--radius-sm)", background: "var(--sage-100)", color: "var(--sage-700)", border: "none", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const deleteBtnStyle: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--danger)", border: "1px solid var(--rose-300)", fontSize: 12, cursor: "pointer" };
const navBtnStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-raised)", cursor: "pointer", color: "var(--fg2)", fontSize: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" };
const formCardStyle: React.CSSProperties = { padding: "20px 24px", borderRadius: "var(--radius-lg)", background: "var(--bg-raised)", border: "1px solid var(--border)", marginBottom: 20 };
const emptyStyle: React.CSSProperties = { padding: "60px 20px", textAlign: "center", color: "var(--fg3)", fontSize: 15 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg2)", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", height: 38, padding: "0 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", outline: "none" };
const selectStyle: React.CSSProperties = { height: 38, padding: "0 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", cursor: "pointer", outline: "none" };
