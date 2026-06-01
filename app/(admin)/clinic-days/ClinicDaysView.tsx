"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth, startOfMonth } from "date-fns";

interface Clinic {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

interface ClinicSession {
  id: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  counterNeeded: number;
  mobileNeeded: number;
  doctorIds: string;
  clinicId: string | null;
  clinic: Clinic | null;
}

interface ClinicDay {
  id: string;
  date: Date | string;
  isOpen: boolean;
  sessions: ClinicSession[];
}

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
}

interface Props {
  year: number;
  month: number;
  clinicDays: ClinicDay[];
  doctors: Doctor[];
  clinics: Clinic[];
}

const SESSION_TYPES = [
  { value: "morning", label: "早診", defaultStart: "09:00", defaultEnd: "12:00" },
  { value: "afternoon", label: "午診", defaultStart: "14:00", defaultEnd: "17:00" },
  { value: "evening", label: "晚診", defaultStart: "18:00", defaultEnd: "21:00" },
];
const SESSION_LABELS: Record<string, string> = { morning: "早診", afternoon: "午診", evening: "晚診" };
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function parseDoctorIds(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function dateKey(date: Date | string): string {
  // Always use UTC date parts to avoid timezone shift on ISO strings like "2026-06-01T00:00:00.000Z"
  if (date instanceof Date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(date).slice(0, 10);
}

// Soft colors for clinics
const CLINIC_BG_COLORS = ["#EBF2ED", "#E9EEF1", "#F3EAE1", "#F2E6E5"];
const CLINIC_BORDER_COLORS = ["#7C9080", "#93A8B2", "#C3A083", "#C39B99"];

export default function ClinicDaysView({ year, month, clinicDays, doctors, clinics }: Props) {
  const router = useRouter();

  const dayMap: Record<string, ClinicDay> = {};
  for (const day of clinicDays) {
    dayMap[dateKey(day.date)] = day;
  }

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [panel, setPanel] = useState<"day" | "add-session">("day");
  const [pendingClinicDayId, setPendingClinicDayId] = useState<string | null>(null);

  // Add session form
  const [selectedClinicId, setSelectedClinicId] = useState(clinics[0]?.id ?? "");
  const [sessionType, setSessionType] = useState("morning");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [counterNeeded, setCounterNeeded] = useState(4);
  const [mobileNeeded, setMobileNeeded] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = startOfMonth(new Date(year, month - 1)).getDay();

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/clinic-days?year=${y}&month=${m}`);
  }

  function toggleDoctor(id: string) {
    setSelectedDoctorIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function toggleDay(dateStr: string) {
    const existing = dayMap[dateStr];
    if (existing) {
      setPendingClinicDayId(null);
      setSelectedDate(dateStr);
      setPanel("day");
    } else {
      setSubmitting(true);
      const res = await fetch("/api/clinic-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      const newDay = await res.json();
      setPendingClinicDayId(newDay.id);
      setSubmitting(false);
      router.refresh();
      setSelectedDate(dateStr);
      setPanel("day");
    }
  }

  function openAddSession() {
    setSelectedClinicId(clinics[0]?.id ?? "");
    setSessionType("morning");
    setStartTime("09:00");
    setEndTime("12:00");
    setSelectedDoctorIds([]);
    setCounterNeeded(4);
    setMobileNeeded(4);
    setFormError(null);
    setPanel("add-session");
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate) return;

    setSubmitting(true);
    setFormError(null);

    try {
      // If clinic day doesn't exist yet, create it first.
      let clinicDayId = dayMap[selectedDate]?.id ?? pendingClinicDayId;
      if (!clinicDayId) {
        const dayRes = await fetch("/api/clinic-days", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate }),
        });
        if (!dayRes.ok) throw new Error("無法建立開診日，請稍後再試。");
        const newDay = await dayRes.json();
        clinicDayId = newDay.id;
        setPendingClinicDayId(newDay.id);
      }
      if (!clinicDayId) throw new Error("找不到開診日，請重新選擇日期。");

      const sessionRes = await fetch("/api/clinic-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicDayId,
          clinicId: selectedClinicId || null,
          sessionType,
          startTime,
          endTime,
          doctorIds: selectedDoctorIds,
          counterNeeded,
          mobileNeeded,
        }),
      });
      if (!sessionRes.ok) throw new Error("無法新增診次，請確認資料後再試。");

      setPanel("day");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "新增診次失敗，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSession(sessionId: string) {
    const res = await fetch(`/api/clinic-sessions/${sessionId}`, { method: "DELETE" });
    if (!res.ok) { alert("刪除診次失敗，請稍後再試。"); return; }
    router.refresh();
  }

  async function removeDay(dateStr: string) {
    const day = dayMap[dateStr];
    if (!day) return;
    const res = await fetch(`/api/clinic-days/${day.id}`, { method: "DELETE" });
    if (!res.ok) { alert("移除開診日失敗，請稍後再試。"); return; }
    setSelectedDate(null);
    router.refresh();
  }

  const selectedDay = selectedDate ? dayMap[selectedDate] : null;

  // Group sessions by clinic
  function groupByClinic(sessions: ClinicSession[]): Record<string, ClinicSession[]> {
    const groups: Record<string, ClinicSession[]> = {};
    for (const s of sessions) {
      const key = s.clinicId ?? "unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  }

  function getClinicColor(clinicId: string | null, idx: number) {
    const clinic = clinics.find((c) => c.id === clinicId);
    if (clinic) return { bg: CLINIC_BG_COLORS[clinics.indexOf(clinic) % CLINIC_BG_COLORS.length], border: clinic.color };
    return { bg: CLINIC_BG_COLORS[idx % CLINIC_BG_COLORS.length], border: CLINIC_BORDER_COLORS[idx % CLINIC_BORDER_COLORS.length] };
  }

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Calendar */}
      <div style={{ flex: 1, padding: "28px 24px 40px", minWidth: 0, overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={h1Style}>開診設定</h1>
            <p style={subStyle}>點選日期設定開診，可同時設定兩間診所的診次</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => navigate(-1)} style={navBtnStyle}>‹</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg1)", minWidth: 80, textAlign: "center" }}>
              {year} 年 {month} 月
            </span>
            <button onClick={() => navigate(1)} style={navBtnStyle}>›</button>
          </div>
        </div>

        {/* Clinic legend */}
        <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
          {clinics.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--fg2)", fontWeight: 500 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
              {c.name}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--fg3)" }}>
            早診 ／ 午診 ／ 晚診
          </div>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {WEEKDAYS.map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, padding: "4px 0", color: i === 0 || i === 6 ? "var(--rose-500)" : "var(--fg3)" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const clinicDay = dayMap[dateStr];
            const dayOfWeek = (firstDayOfWeek + i) % 7;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSelected = selectedDate === dateStr;
            const sessions = clinicDay?.sessions ?? [];

            // Group sessions by clinic, sorted by session type order
            const SESSION_ORDER = ["morning", "afternoon", "evening"];
            const clinicSessionGroups: Record<string, { sessionType: string }[]> = {};
            for (const s of sessions) {
              const key = s.clinicId ?? "none";
              if (!clinicSessionGroups[key]) clinicSessionGroups[key] = [];
              clinicSessionGroups[key].push({ sessionType: s.sessionType });
            }
            // Sort each clinic's sessions by type order
            for (const key of Object.keys(clinicSessionGroups)) {
              clinicSessionGroups[key].sort((a, b) => SESSION_ORDER.indexOf(a.sessionType) - SESSION_ORDER.indexOf(b.sessionType));
            }

            return (
              <button
                key={day}
                onClick={() => toggleDay(dateStr)}
                style={{
                  minHeight: 76,
                  borderRadius: "var(--radius-md)",
                  border: isSelected ? "2px solid var(--sage-500)" : sessions.length > 0 ? "1.5px solid var(--sage-200)" : "1px solid var(--border)",
                  background: isSelected ? "var(--sage-50)" : "var(--bg-raised)",
                  cursor: "pointer",
                  padding: "7px 6px 6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 3,
                  transition: "border-color .15s",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 600, color: isSelected ? "var(--sage-700)" : isWeekend ? "var(--rose-500)" : "var(--fg2)" }}>
                  {day}
                </span>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                  {Object.entries(clinicSessionGroups).map(([clinicId, sessGroup]) => {
                    const c = clinics.find((cl) => cl.id === clinicId);
                    return sessGroup.map((s, si) => (
                      <div key={`${clinicId}-${si}`} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: c?.color ?? "var(--neutral-400)", flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: "var(--fg3)", fontWeight: 600 }}>
                          {c?.shortName ?? "?"}{SESSION_LABELS[s.sessionType] ?? s.sessionType}
                        </span>
                      </div>
                    ));
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      {selectedDate && (
        <div style={{ width: 360, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg-raised)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Panel header */}
          <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg1)" }}>
                {month} 月 {parseInt(selectedDate.split("-")[2])} 日
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 2 }}>
                {selectedDay ? `${selectedDay.sessions.length} 個診次` : "尚未設定為開診日"}
              </div>
            </div>
            <button onClick={() => setSelectedDate(null)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "var(--neutral-100)", cursor: "pointer", fontSize: 16, color: "var(--fg3)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "14px 20px" }}>
            {panel === "day" && (
              <>
                {/* Group sessions by clinic */}
                {selectedDay && selectedDay.sessions.length > 0 ? (
                  clinics.map((clinic, ci) => {
                    const clinicSessions = selectedDay.sessions.filter((s) => s.clinicId === clinic.id);
                    if (clinicSessions.length === 0) return null;
                    const colors = getClinicColor(clinic.id, ci);
                    return (
                      <div key={clinic.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: clinic.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg1)" }}>{clinic.name}</span>
                        </div>
                        {clinicSessions.map((session) => {
                          const docNames = parseDoctorIds(session.doctorIds)
                            .map((id) => doctors.find((d) => d.id === id)?.name)
                            .filter(Boolean);
                          return (
                            <div key={session.id} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: colors.bg, borderLeft: `3px solid ${colors.border}`, marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fg1)" }}>
                                  {SESSION_LABELS[session.sessionType]}
                                </span>
                                <button onClick={() => deleteSession(session.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                              </div>
                              <div style={{ fontSize: 12.5, color: "var(--fg2)", marginTop: 5, display: "flex", flexDirection: "column", gap: 2 }}>
                                <div>
                                  <span style={{ color: "var(--fg3)" }}>醫師：</span>
                                  {docNames.length > 0 ? docNames.join("、") : "未指定"}
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                  <span><span style={{ color: "var(--fg3)" }}>品叡櫃檯：</span>{session.counterNeeded} 人</span>
                                  <span><span style={{ color: "var(--fg3)" }}>機動：</span>{session.mobileNeeded} 人</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "var(--fg3)", fontSize: 13.5 }}>
                    尚未新增任何診次
                  </div>
                )}

                <button onClick={openAddSession} style={{ width: "100%", height: 38, borderRadius: "var(--radius-md)", border: "1.5px dashed var(--sage-300)", background: "transparent", color: "var(--sage-600)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
                  + 新增診次
                </button>
                {selectedDay && (
                  <button onClick={() => removeDay(selectedDate)} style={{ width: "100%", height: 34, marginTop: 8, borderRadius: "var(--radius-md)", border: "1px solid var(--rose-300)", background: "transparent", color: "var(--danger)", fontSize: 13, cursor: "pointer" }}>
                    移除此開診日
                  </button>
                )}
              </>
            )}

            {panel === "add-session" && (
              <form onSubmit={addSession} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg1)" }}>新增診次</div>
                {formError && (
                  <div style={{ padding: "9px 11px", borderRadius: "var(--radius-md)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
                    {formError}
                  </div>
                )}

                {/* Clinic selector */}
                {clinics.length > 0 && (
                  <div>
                    <label style={labelStyle}>診所 *</label>
                    <div style={{ display: "flex", gap: 7 }}>
                      {clinics.map((c, i) => (
                        <button key={c.id} type="button" onClick={() => setSelectedClinicId(c.id)} style={{
                          flex: 1, height: 36, borderRadius: "var(--radius-md)",
                          border: selectedClinicId === c.id ? `2px solid ${c.color}` : "1.5px solid var(--border)",
                          background: selectedClinicId === c.id ? CLINIC_BG_COLORS[i % CLINIC_BG_COLORS.length] : "transparent",
                          color: selectedClinicId === c.id ? c.color : "var(--fg3)",
                          fontSize: 13.5, fontWeight: 700, cursor: "pointer", transition: "all .15s",
                        }}>
                          {c.shortName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Session type */}
                <div>
                  <label style={labelStyle}>班別 *</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {SESSION_TYPES.map((s) => (
                      <button key={s.value} type="button" onClick={() => { setSessionType(s.value); setStartTime(s.defaultStart); setEndTime(s.defaultEnd); }} style={{
                        flex: 1, height: 34, borderRadius: "var(--radius-md)",
                        border: sessionType === s.value ? "2px solid var(--sage-500)" : "1.5px solid var(--border)",
                        background: sessionType === s.value ? "var(--sage-50)" : "transparent",
                        color: sessionType === s.value ? "var(--sage-700)" : "var(--fg3)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>{s.label}</button>
                    ))}
                  </div>
                </div>

                {/* Time is auto-set by session type */}

                {/* Multiple doctors */}
                <div>
                  <label style={labelStyle}>看診醫師（可多選）</label>
                  {doctors.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--fg3)" }}>尚未建立醫師資料</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {doctors.map((doc) => {
                        const sel = selectedDoctorIds.includes(doc.id);
                        return (
                          <button key={doc.id} type="button" onClick={() => toggleDoctor(doc.id)} style={{
                            height: 30, padding: "0 11px", borderRadius: "var(--radius-full)",
                            border: sel ? "2px solid var(--mist-500)" : "1.5px solid var(--border)",
                            background: sel ? "var(--mist-100)" : "transparent",
                            color: sel ? "var(--mist-700)" : "var(--fg3)",
                            fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                          }}>
                            {sel && "✓ "}{doc.name}{doc.specialty ? ` (${doc.specialty})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Staff counts */}
                <div>
                  <label style={labelStyle}>
                    {clinics.find((c) => c.id === selectedClinicId)?.name ?? "診所"}人力需求
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...labelStyle, fontSize: 11.5, color: "var(--fg3)" }}>櫃檯人數</label>
                      <input type="number" min={0} max={10} value={counterNeeded} onChange={(e) => setCounterNeeded(parseInt(e.target.value))} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...labelStyle, fontSize: 11.5, color: "var(--fg3)" }}>機動人數</label>
                      <input type="number" min={0} max={10} value={mobileNeeded} onChange={(e) => setMobileNeeded(parseInt(e.target.value))} style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button type="submit" disabled={submitting} style={{ flex: 1, height: 40, borderRadius: "var(--radius-md)", background: "var(--sage-500)", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
                    {submitting ? "儲存中..." : "新增"}
                  </button>
                  <button type="button" onClick={() => setPanel("day")} style={{ flex: 1, height: 40, borderRadius: "var(--radius-md)", background: "transparent", color: "var(--fg2)", border: "1px solid var(--border)", fontSize: 14, cursor: "pointer" }}>
                    取消
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const h1Style: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--fg1)", margin: 0 };
const subStyle: React.CSSProperties = { fontSize: 13, color: "var(--fg3)", margin: "3px 0 0" };
const navBtnStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-raised)", cursor: "pointer", color: "var(--fg2)", fontSize: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: "100%", height: 36, padding: "0 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", outline: "none" };
