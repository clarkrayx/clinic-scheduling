"use client";

import { useRouter } from "next/navigation";
import { getDaysInMonth, startOfMonth } from "date-fns";

interface Assistant {
  id: string;
  name: string;
}

interface PreferenceDay {
  assistantId: string;
  assistantName: string;
  date: Date | string;
  reason: string | null;
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

  // 依日期分組：day(數字) -> 助理姓名陣列
  const byDay: Record<number, string[]> = {};
  for (const p of preferenceDays) {
    const d = dayOfDate(p.date);
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(p.assistantName);
  }

  // 依助理分組：assistantId -> 天數
  const byAssistant: Record<string, number> = {};
  for (const p of preferenceDays) {
    byAssistant[p.assistantId] = (byAssistant[p.assistantId] ?? 0) + 1;
  }

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0 }}>
            助理畫假總覽
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" }}>
            排班前先檢視所有助理本月希望休假的日期（僅供參考）
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

      {preferenceDays.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg3)", fontSize: 15 }}>
          本月還沒有任何助理畫假
        </div>
      ) : (
        <>
          {/* 每位助理畫假天數摘要 */}
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
                  {a.name}：{count} 天
                </span>
              );
            })}
          </div>

          {/* 月曆顯示 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{
                textAlign: "center", fontSize: 12, fontWeight: 600, padding: "4px 0",
                color: i === 0 || i === 6 ? "var(--rose-500)" : "var(--fg3)",
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const names = byDay[day] ?? [];
              const dayOfWeek = (firstDayOfWeek + i) % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <div
                  key={day}
                  style={{
                    minHeight: 92,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: names.length > 0 ? "var(--rose-100)" : "var(--bg-raised)",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: 600, alignSelf: "flex-end",
                    color: isWeekend ? "var(--rose-500)" : "var(--fg2)",
                  }}>
                    {day}
                  </span>
                  {names.map((name, idx) => (
                    <span key={idx} style={{
                      fontSize: 11, color: "var(--rose-700)", fontWeight: 600,
                      lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {name}
                    </span>
                  ))}
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
