"use client";

import { useRouter } from "next/navigation";
import { getDaysInMonth, startOfMonth } from "date-fns";

const SESSIONS = [
  { key: "morning", label: "早" },
  { key: "afternoon", label: "午" },
  { key: "evening", label: "晚" },
] as const;

type SessionKey = "morning" | "afternoon" | "evening";

const SESSION_BG: Record<SessionKey, string> = {
  morning: "var(--clay-100, #f5ebe0)",
  afternoon: "var(--mist-100, #e8f0f5)",
  evening: "var(--rose-100, #fce8e8)",
};
const SESSION_COLOR: Record<SessionKey, string> = {
  morning: "var(--clay-700, #7a4f28)",
  afternoon: "var(--mist-700, #2a6080)",
  evening: "var(--rose-700, #8a3030)",
};

interface Assistant {
  id: string;
  name: string;
}

interface PreferenceDay {
  assistantId: string;
  assistantName: string;
  date: Date | string;
  sessionType: string;
}

interface Props {
  year: number;
  month: number;
  assistants: Assistant[];
  preferenceDays: PreferenceDay[];
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function dayOfDate(date: Date | string): number {
  if (date instanceof Date) return date.getUTCDate();
  return parseInt(String(date).slice(8, 10));
}

export default function PreferenceOverviewView({ year, month, assistants, preferenceDays }: Props) {
  const router = useRouter();
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = startOfMonth(new Date(year, month - 1)).getDay();

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/preference-overview?year=${y}&month=${m}`);
  }

  // byDay[day] = { assistantId -> Set<sessionKey> }
  const byDay: Record<number, Record<string, Set<string>>> = {};
  for (const p of preferenceDays) {
    const d = dayOfDate(p.date);
    if (!byDay[d]) byDay[d] = {};
    if (!byDay[d][p.assistantId]) byDay[d][p.assistantId] = new Set();
    byDay[d][p.assistantId].add(p.sessionType);
  }

  // 每位助理的統計（各診別各幾個）
  const byAssistant: Record<string, number> = {};
  for (const p of preferenceDays) {
    byAssistant[p.assistantId] = (byAssistant[p.assistantId] ?? 0) + 1;
  }

  return (
    <div style={{ padding: "28px 32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0 }}>
            助理劃假總覽
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" }}>
            排班前先確認各助理希望休假的診次
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

      {/* Legend */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {SESSIONS.map((s) => (
          <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span style={{ padding: "1px 7px", borderRadius: 4, background: SESSION_BG[s.key], color: SESSION_COLOR[s.key], fontWeight: 700 }}>
              {s.label}
            </span>
          </span>
        ))}
        <span style={{ fontSize: 12, color: "var(--fg3)" }}>= 早診 / 午診 / 晚診</span>
      </div>

      {/* Assistant summary chips */}
      {preferenceDays.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {assistants.map((a) => {
            const count = byAssistant[a.id] ?? 0;
            return (
              <span key={a.id} style={{
                padding: "5px 12px", borderRadius: "var(--radius-full)",
                fontSize: 13, fontWeight: 600,
                background: count > 0 ? "var(--rose-100)" : "var(--neutral-100)",
                color: count > 0 ? "var(--rose-700)" : "var(--fg3)",
              }}>
                {a.name}：{count} 診次
              </span>
            );
          })}
        </div>
      )}

      {preferenceDays.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg3)", fontSize: 15 }}>
          本月還沒有任何助理劃假
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{
                textAlign: "center", fontSize: 12, fontWeight: 600, padding: "4px 0",
                color: i === 0 || i === 6 ? "var(--rose-500)" : "var(--fg3)",
              }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayOfWeek = (firstDayOfWeek + i) % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const dayData = byDay[day] ?? {};
              const hasAny = Object.keys(dayData).length > 0;

              return (
                <div
                  key={day}
                  style={{
                    minHeight: 80,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: hasAny ? "var(--rose-50, #fff8f8)" : "var(--bg-raised)",
                    padding: "7px 8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: 600, alignSelf: "flex-end",
                    color: isWeekend ? "var(--rose-500)" : "var(--fg2)",
                  }}>
                    {day}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {Object.entries(dayData).map(([astId, sessions]) => {
                      const ast = assistants.find((a) => a.id === astId);
                      if (!ast) return null;
                      return (
                        <div key={astId} style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10.5, color: "var(--fg2)", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {ast.name.slice(-2)}
                          </span>
                          {SESSIONS.filter((s) => sessions.has(s.key)).map((s) => (
                            <span key={s.key} style={{
                              padding: "0 4px", borderRadius: 3, fontSize: 10, fontWeight: 700,
                              background: SESSION_BG[s.key], color: SESSION_COLOR[s.key],
                            }}>
                              {s.label}
                            </span>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
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
