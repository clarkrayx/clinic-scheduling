"use client";

import { useRouter } from "next/navigation";
import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { zhTW } from "date-fns/locale";

interface Assignment {
  id: string;
  role: string;
  assistant: { id: string; user: { name: string } };
  clinicSession: {
    id: string;
    sessionType: string;
    startTime: string;
    endTime: string;
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

interface Props {
  year: number;
  month: number;
  schedule: ScheduleData | null;
  isAdmin: boolean;
  myAssistantId: string | null;
}

const SESSION_COLORS: Record<string, string> = {
  morning: "var(--clay-300)",
  afternoon: "var(--mist-300)",
  evening: "var(--rose-300)",
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
const ROLE_LABELS: Record<string, string> = {
  counter: "櫃檯",
  mobile: "機動",
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

export default function ScheduleView({
  year,
  month,
  schedule,
  isAdmin,
  myAssistantId,
}: Props) {
  const router = useRouter();
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDay = startOfMonth(new Date(year, month - 1)).getDay();

  function navigate(dir: number) {
    let y = year;
    let m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/schedule?year=${y}&month=${m}`);
  }

  // Build a map: date string -> assignments
  const assignmentsByDate: Record<string, Assignment[]> = {};
  if (schedule) {
    for (const a of schedule.shiftAssignments) {
      const dateStr = dateKey(a.clinicSession.clinicDay.date);
      if (!assignmentsByDate[dateStr]) assignmentsByDate[dateStr] = [];
      assignmentsByDate[dateStr].push(a);
    }
  }

  // For assistant view, filter to own assignments
  function getMyAssignments(dateStr: string): Assignment[] {
    const all = assignmentsByDate[dateStr] ?? [];
    if (isAdmin) return all;
    if (!myAssistantId) return [];
    return all.filter((a) => a.assistant.id === myAssistantId);
  }

  // Count my sessions this month
  const myTotalSessions = myAssistantId
    ? (schedule?.shiftAssignments ?? []).filter(
        (a) => a.assistant.id === myAssistantId
      ).length
    : 0;

  const publishedLabel =
    schedule?.status === "PUBLISHED" ? "已發布" : schedule ? "草稿" : null;

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--fg1)",
              margin: 0,
            }}
          >
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
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: 12.5,
                fontWeight: 600,
                background:
                  schedule?.status === "PUBLISHED"
                    ? "var(--success-soft)"
                    : "var(--warning-soft)",
                color:
                  schedule?.status === "PUBLISHED"
                    ? "var(--success)"
                    : "var(--warning)",
              }}
            >
              {publishedLabel}
            </span>
          )}
          <button onClick={() => navigate(-1)} style={navBtnStyle}>
            ‹
          </button>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--fg2)",
              minWidth: 72,
              textAlign: "center",
            }}
          >
            {month} 月
          </span>
          <button onClick={() => navigate(1)} style={navBtnStyle}>
            ›
          </button>
          {isAdmin && (
            <a
              href="/generate"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                height: 38,
                padding: "0 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--sage-500)",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ✦ 自動排班
            </a>
          )}
        </div>
      </div>

      {!schedule ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "80px 20px",
            gap: 12,
            color: "var(--fg3)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-lg)",
              background: "var(--surface-tint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            📅
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg2)", margin: 0 }}>
            本月尚未排班
          </p>
          {isAdmin ? (
            <p style={{ fontSize: 14, margin: 0 }}>
              前往{" "}
              <a href="/generate" style={{ color: "var(--sage-600)" }}>
                自動排班
              </a>{" "}
              產生本月班表
            </p>
          ) : (
            <p style={{ fontSize: 14, margin: 0 }}>班表尚未發布，請稍候。</p>
          )}
        </div>
      ) : (
        <div>
          {/* Weekday headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginBottom: 6,
            }}
          >
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: i === 0 || i === 6 ? "var(--rose-500)" : "var(--fg3)",
                  padding: "4px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}
          >
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayOfWeek = (firstDay + i) % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const myA = getMyAssignments(dateStr);

              return (
                <div
                  key={day}
                  style={{
                    minHeight: 88,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-raised)",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isWeekend ? "var(--rose-500)" : "var(--fg2)",
                    }}
                  >
                    {day}
                  </span>
                  {myA.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: "3px 7px",
                        borderRadius: 6,
                        background: SESSION_BG[a.clinicSession.sessionType] ?? "var(--sage-100)",
                        borderLeft: `3px solid ${SESSION_COLORS[a.clinicSession.sessionType] ?? "var(--sage-300)"}`,
                        fontSize: 11.5,
                        lineHeight: 1.35,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--fg1)" }}>
                        {SESSION_LABELS[a.clinicSession.sessionType] ?? a.clinicSession.sessionType}
                        {isAdmin && (
                          <span
                            style={{
                              marginLeft: 4,
                              fontSize: 10.5,
                              color: "var(--fg3)",
                              fontWeight: 500,
                            }}
                          >
                            {ROLE_LABELS[a.role] ?? a.role}
                          </span>
                        )}
                      </div>
                      {isAdmin && (
                        <div style={{ color: "var(--fg2)", fontSize: 11 }}>
                          {a.assistant.user.name}
                        </div>
                      )}
                      {!isAdmin && a.clinicSession.clinic && (
                        <div style={{ color: "var(--fg3)", fontSize: 11 }}>
                          {a.clinicSession.clinic.shortName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 20,
              padding: "12px 16px",
              background: "var(--bg-raised)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            {Object.entries(SESSION_LABELS).map(([key, label]) => (
              <div
                key={key}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: SESSION_COLORS[key],
                  }}
                />
                <span style={{ fontSize: 12.5, color: "var(--fg2)", fontWeight: 500 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--bg-raised)",
  cursor: "pointer",
  color: "var(--fg2)",
  fontSize: 18,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
