"use client";

import { useRouter } from "next/navigation";
import { getDaysInMonth, startOfMonth } from "date-fns";
import { useState } from "react";

interface Assignment {
  id: string;
  role: string;
  assistant: { id: string; user: { name: string } };
  clinicSession: {
    id: string;
    sessionType: string;
    startTime: string;
    endTime: string;
    doctorIds: string;
    clinic: { name: string; shortName: string; color: string } | null;
    clinicDay: { date: Date | string };
  };
}

interface ScheduleData {
  id: string;
  year: number;
  month: number;
  status: string;
  shiftAssignments: Assignment[];
}

interface Doctor {
  id: string;
  name: string;
}

interface Props {
  year: number;
  month: number;
  schedule: ScheduleData | null;
  isAdmin: boolean;
  myAssistantId: string | null;
  doctors: Doctor[];
}

const SESSION_BORDER: Record<string, string> = {
  morning: "var(--clay-400, #c4945a)",
  afternoon: "var(--mist-400, #6aa8c0)",
  evening: "var(--rose-400, #d09090)",
};
const SESSION_BG: Record<string, string> = {
  morning: "var(--clay-100)",
  afternoon: "var(--mist-100)",
  evening: "var(--rose-100)",
};
const SESSION_LABELS: Record<string, string> = {
  morning: "早診",
  afternoon: "午診",
  evening: "晚診",
};
const SESSION_TEXT: Record<string, string> = {
  morning: "var(--clay-700, #7a4f28)",
  afternoon: "var(--mist-700, #2a6080)",
  evening: "var(--rose-700, #8a3030)",
};
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function dateKey(date: Date | string): string {
  if (date instanceof Date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(date).slice(0, 10);
}

// Group assignments for one day into sessions
function groupBySession(
  assignments: Assignment[],
  doctorMap: Record<string, string>
) {
  const map: Record<
    string,
    {
      sessionId: string;
      sessionType: string;
      clinicShort: string;
      clinicColor: string;
      doctors: string[];
      counters: string[];
      mobiles: string[];
    }
  > = {};

  for (const a of assignments) {
    const sid = a.clinicSession.id;
    if (!map[sid]) {
      let doctorIds: string[] = [];
      try { doctorIds = JSON.parse(a.clinicSession.doctorIds ?? "[]"); } catch { /* empty */ }
      map[sid] = {
        sessionId: sid,
        sessionType: a.clinicSession.sessionType,
        clinicShort: a.clinicSession.clinic?.shortName ?? a.clinicSession.clinic?.name ?? "診所",
        clinicColor: a.clinicSession.clinic?.color ?? "var(--sage-500)",
        doctors: doctorIds.map((id) => doctorMap[id]).filter(Boolean),
        counters: [],
        mobiles: [],
      };
    }
    const name = a.assistant.user.name;
    if (a.role === "counter") map[sid].counters.push(name);
    else map[sid].mobiles.push(name);
  }

  // Sort by session type order
  const order = ["morning", "afternoon", "evening"];
  return Object.values(map).sort(
    (a, b) => order.indexOf(a.sessionType) - order.indexOf(b.sessionType)
  );
}

export default function ScheduleView({
  year,
  month,
  schedule,
  isAdmin,
  myAssistantId,
  doctors,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDay = startOfMonth(new Date(year, month - 1)).getDay();

  const doctorMap: Record<string, string> = Object.fromEntries(
    doctors.map((d) => [d.id, d.name])
  );

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/schedule?year=${y}&month=${m}`);
  }

  async function handleDeleteSchedule() {
    if (!schedule) return;
    setDeleting(true);
    await fetch(`/api/schedule/${schedule.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(false);
    router.refresh();
  }

  const assignmentsByDate: Record<string, Assignment[]> = {};
  if (schedule) {
    for (const a of schedule.shiftAssignments) {
      const dk = dateKey(a.clinicSession.clinicDay.date);
      if (!assignmentsByDate[dk]) assignmentsByDate[dk] = [];
      assignmentsByDate[dk].push(a);
    }
  }

  const myTotalSessions = myAssistantId
    ? (schedule?.shiftAssignments ?? []).filter(a => a.assistant.id === myAssistantId).length
    : 0;

  const publishedLabel = schedule?.status === "PUBLISHED" ? "已發布" : schedule ? "草稿" : null;

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 1300 }}>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: "white", borderRadius: "var(--radius-lg)",
            padding: "28px 32px", maxWidth: 400, width: "90%",
            boxShadow: "0 8px 32px rgba(0,0,0,.15)",
          }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700, color: "var(--fg1)" }}>
              確認刪除班表？
            </h3>
            <p style={{ fontSize: 14, color: "var(--fg3)", margin: "0 0 24px", lineHeight: 1.6 }}>
              {year} 年 {month} 月的班表（{schedule?.shiftAssignments.length} 個班次）將被永久刪除，刪除後可重新生成。
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ height: 38, padding: "0 16px", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--fg2)", border: "1px solid var(--border)", fontSize: 14, cursor: "pointer" }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteSchedule}
                disabled={deleting}
                style={{ height: 38, padding: "0 16px", borderRadius: "var(--radius-md)", background: "#c97070", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: deleting ? "wait" : "pointer" }}
              >
                {deleting ? "刪除中…" : "確認刪除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0 }}>
            {year} 年 {month} 月排班
          </h1>
          {!isAdmin && myAssistantId && schedule?.status === "PUBLISHED" && (
            <p style={{ fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" }}>
              本月共 {myTotalSessions} 個診次
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {publishedLabel && (
            <span style={{
              padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: 12.5, fontWeight: 600,
              background: schedule?.status === "PUBLISHED" ? "var(--success-soft)" : "var(--warning-soft)",
              color: schedule?.status === "PUBLISHED" ? "var(--success)" : "var(--warning)",
            }}>
              {publishedLabel}
            </span>
          )}
          <button onClick={() => navigate(-1)} style={navBtnStyle}>‹</button>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg2)", minWidth: 44, textAlign: "center" }}>
            {month} 月
          </span>
          <button onClick={() => navigate(1)} style={navBtnStyle}>›</button>
          {isAdmin && schedule && (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                height: 38, padding: "0 14px", borderRadius: "var(--radius-md)",
                background: "transparent", color: "#c97070",
                border: "1.5px solid #e0b0b0", fontSize: 13.5, fontWeight: 600,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <TrashIcon size={14} /> 刪除班表
            </button>
          )}
          {isAdmin && (
            <a href="/generate" style={{
              display: "inline-flex", alignItems: "center", gap: 7, height: 38,
              padding: "0 16px", borderRadius: "var(--radius-md)",
              background: "var(--sage-500)", color: "white",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              ✦ 自動排班
            </a>
          )}
        </div>
      </div>

      {!schedule ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", gap: 12, color: "var(--fg3)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", background: "var(--surface-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📅</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg2)", margin: 0 }}>本月尚未排班</p>
          {isAdmin
            ? <p style={{ fontSize: 14, margin: 0 }}>前往 <a href="/generate" style={{ color: "var(--sage-600)" }}>自動排班</a> 產生本月班表</p>
            : <p style={{ fontSize: 14, margin: 0 }}>班表尚未發布，請稍候。</p>
          }
        </div>
      ) : (
        <div>
          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, marginBottom: 5 }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, padding: "4px 0", color: i === 0 || i === 6 ? "var(--rose-500)" : "var(--fg3)" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayOfWeek = (firstDay + i) % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const allA = assignmentsByDate[dateStr] ?? [];

              // Admin: show grouped by session; Assistant: show own only
              const displayAssignments = isAdmin
                ? allA
                : allA.filter(a => a.assistant.id === myAssistantId);

              const sessions = isAdmin
                ? groupBySession(allA, doctorMap)
                : null;

              const hasWork = displayAssignments.length > 0;

              return (
                <div key={day} style={{
                  minHeight: isAdmin ? 110 : 88,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-raised)",
                  padding: "7px 7px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}>
                  {/* Date number */}
                  <span style={{
                    fontSize: 12.5, fontWeight: 600, alignSelf: "flex-end",
                    color: isWeekend ? "var(--rose-500)" : hasWork ? "var(--fg1)" : "var(--fg3)",
                  }}>
                    {day}
                  </span>

                  {/* Admin: grouped session blocks */}
                  {isAdmin && sessions && sessions.map((sess) => (
                    <div key={sess.sessionId} style={{
                      borderRadius: 6,
                      border: `1.5px solid ${SESSION_BORDER[sess.sessionType] ?? "var(--border)"}`,
                      background: SESSION_BG[sess.sessionType] ?? "var(--neutral-50)",
                      padding: "4px 6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}>
                      {/* Session header: clinic + type */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: sess.clinicColor, flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: SESSION_TEXT[sess.sessionType] ?? "var(--fg2)" }}>
                          {sess.clinicShort} {SESSION_LABELS[sess.sessionType]}
                        </span>
                      </div>

                      {/* Doctors */}
                      {sess.doctors.length > 0 && (
                        <div style={{ fontSize: 10, color: "var(--fg3)", paddingLeft: 10, lineHeight: 1.3 }}>
                          {sess.doctors.map(n => n.slice(n.length === 3 ? 1 : 0)).join("・")} 醫師
                        </div>
                      )}

                      {/* Counter assistants */}
                      {sess.counters.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, paddingLeft: 10 }}>
                          <span style={{ fontSize: 9.5, color: "var(--fg3)", fontWeight: 600, flexShrink: 0 }}>櫃</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            {sess.counters.map((name, idx) => (
                              <span key={idx} style={{
                                fontSize: 10, fontWeight: 600, color: "var(--fg1)",
                                background: "rgba(255,255,255,.7)", borderRadius: 3,
                                padding: "0 3px",
                              }}>
                                {name.slice(-2)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mobile assistants */}
                      {sess.mobiles.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, paddingLeft: 10 }}>
                          <span style={{ fontSize: 9.5, color: "var(--fg3)", fontWeight: 600, flexShrink: 0 }}>機</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            {sess.mobiles.map((name, idx) => (
                              <span key={idx} style={{
                                fontSize: 10, fontWeight: 600, color: "var(--fg1)",
                                background: "rgba(255,255,255,.7)", borderRadius: 3,
                                padding: "0 3px",
                              }}>
                                {name.slice(-2)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Assistant: own schedule */}
                  {!isAdmin && displayAssignments.map((a) => (
                    <div key={a.id} style={{
                      padding: "3px 7px",
                      borderRadius: 6,
                      background: SESSION_BG[a.clinicSession.sessionType] ?? "var(--sage-100)",
                      borderLeft: `3px solid ${SESSION_BORDER[a.clinicSession.sessionType] ?? "var(--sage-300)"}`,
                      fontSize: 11.5,
                      lineHeight: 1.35,
                    }}>
                      <div style={{ fontWeight: 600, color: "var(--fg1)" }}>
                        {SESSION_LABELS[a.clinicSession.sessionType] ?? a.clinicSession.sessionType}
                      </div>
                      {a.clinicSession.clinic && (
                        <div style={{ color: "var(--fg3)", fontSize: 11 }}>
                          {a.clinicSession.clinic.shortName} · {a.role === "counter" ? "櫃檯" : "機動"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", gap: 20, marginTop: 16, padding: "12px 16px",
            background: "var(--bg-raised)", borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)", flexWrap: "wrap", alignItems: "center",
          }}>
            {Object.entries(SESSION_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: SESSION_BORDER[key] }} />
                <span style={{ fontSize: 12.5, color: "var(--fg2)", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
            {isAdmin && (
              <>
                <span style={{ color: "var(--border)", fontSize: 16 }}>|</span>
                <span style={{ fontSize: 12, color: "var(--fg3)" }}>櫃 = 櫃檯　機 = 機動</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)", background: "var(--bg-raised)",
  cursor: "pointer", color: "var(--fg2)", fontSize: 18,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
