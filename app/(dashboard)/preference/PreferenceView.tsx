"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth, startOfMonth } from "date-fns";

interface PreferenceDay {
  date: Date | string;
  reason: string | null;
}

interface Props {
  year: number;
  month: number;
  assistantId: string;
  preferenceDays: PreferenceDay[];
}

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

export default function PreferenceView({ year, month, assistantId, preferenceDays }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // 已畫假的日期集合
  const marked = new Set(preferenceDays.map((p) => dateKey(p.date)));

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = startOfMonth(new Date(year, month - 1)).getDay();

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/preference?year=${y}&month=${m}`);
  }

  async function toggleDay(dateStr: string) {
    if (busy) return;
    setBusy(true);
    if (marked.has(dateStr)) {
      const res = await fetch(`/api/preference-days/${dateStr}?assistantId=${assistantId}`, {
        method: "DELETE",
      });
      if (!res.ok) { alert("取消失敗，請稍後再試。"); setBusy(false); return; }
    } else {
      const res = await fetch("/api/preference-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, assistantId }),
      });
      if (!res.ok) { alert("畫假失敗，請稍後再試。"); setBusy(false); return; }
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0 }}>
            畫假（希望休假）
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" }}>
            點選您希望休息的日期，排班時會盡量參考（非保證）
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

      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
        background: "var(--surface-tint)", borderRadius: "var(--radius-md)",
        margin: "16px 0 18px", fontSize: 13, color: "var(--fg2)",
      }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--rose-300)", flexShrink: 0 }} />
        已標記為希望休假 · 共 {marked.size} 天
      </div>

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
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isMarked = marked.has(dateStr);
          const dayOfWeek = (firstDayOfWeek + i) % 7;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <button
              key={day}
              onClick={() => toggleDay(dateStr)}
              disabled={busy}
              style={{
                minHeight: 64,
                borderRadius: "var(--radius-md)",
                border: isMarked ? "2px solid var(--rose-500)" : "1px solid var(--border)",
                background: isMarked ? "var(--rose-100)" : "var(--bg-raised)",
                cursor: busy ? "wait" : "pointer",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                transition: "all .15s",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: isMarked ? "var(--rose-700)" : isWeekend ? "var(--rose-500)" : "var(--fg2)",
              }}>
                {day}
              </span>
              {isMarked && (
                <span style={{ fontSize: 11, color: "var(--rose-700)", fontWeight: 600 }}>希望休</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)", background: "var(--bg-raised)",
  cursor: "pointer", color: "var(--fg2)", fontSize: 18,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};
