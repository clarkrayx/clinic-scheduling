"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth, startOfMonth } from "date-fns";

const SESSIONS = [
  { key: "morning", label: "早診" },
  { key: "afternoon", label: "午診" },
  { key: "evening", label: "晚診" },
] as const;

type SessionKey = "morning" | "afternoon" | "evening";

interface PreferenceDay {
  date: Date | string;
  sessionType: string;
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

function markedKey(date: string, session: SessionKey) {
  return `${date}:${session}`;
}

export default function PreferenceView({ year, month, assistantId, preferenceDays }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  // modal state — null = closed, or { dateStr, session, isEdit }
  const [modalData, setModalData] = useState<{ dateStr: string; session: SessionKey; isEdit: boolean } | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  const markedMap = new Map(
    preferenceDays.map((p) => [markedKey(dateKey(p.date), p.sessionType as SessionKey), p.reason ?? ""])
  );

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = startOfMonth(new Date(year, month - 1)).getDay();
  const totalMarked = markedMap.size;

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    router.push(`/preference?year=${y}&month=${m}`);
  }

  function handleDayClick(dateStr: string, session: SessionKey) {
    if (busy) return;
    const key = markedKey(dateStr, session);
    if (markedMap.has(key)) {
      // Already marked — open edit modal with existing reason
      setReasonInput(markedMap.get(key) ?? "");
      setModalData({ dateStr, session, isEdit: true });
    } else {
      // New mark — open modal with empty reason
      setReasonInput("");
      setModalData({ dateStr, session, isEdit: false });
    }
  }

  const doUnmark = useCallback(async (dateStr: string, session: SessionKey) => {
    const key = markedKey(dateStr, session);
    setBusy(key);
    setModalData(null);
    await fetch(`/api/preference-days/${dateStr}?assistantId=${assistantId}&sessionType=${session}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }, [assistantId, router]);

  async function confirmMark() {
    if (!modalData) return;
    const { dateStr, session } = modalData;
    const key = markedKey(dateStr, session);
    setBusy(key);
    setModalData(null);
    await fetch("/api/preference-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, sessionType: session, assistantId, reason: reasonInput }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div style={{ padding: "28px 32px 40px" }}>
      {/* Reason modal */}
      {modalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "28px 32px", maxWidth: 420, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,.15)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--fg1)" }}>
              {modalData.isEdit ? "編輯" : "標記"} {modalData.dateStr.slice(5)} {SESSIONS.find(s => s.key === modalData.session)?.label}
            </h3>
            <p style={{ fontSize: 13, color: "var(--fg3)", margin: "0 0 14px" }}>
              {modalData.isEdit ? "修改請假理由，或移除此劃假" : "填寫請假理由（選填）"}
            </p>
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              rows={3}
              placeholder="例：出遊、家事、身體不適..."
              autoFocus
              style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, color: "var(--fg1)", outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between", alignItems: "center" }}>
              {/* Remove button (edit mode only) */}
              {modalData.isEdit && (
                <button
                  onClick={() => doUnmark(modalData.dateStr, modalData.session)}
                  style={{ height: 36, padding: "0 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--rose-300)", background: "transparent", color: "var(--rose-600)", fontSize: 13, cursor: "pointer" }}
                >
                  移除劃假
                </button>
              )}
              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                <button
                  onClick={() => setModalData(null)}
                  style={{ height: 36, padding: "0 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--fg2)", fontSize: 13.5, cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  onClick={confirmMark}
                  style={{ height: 36, padding: "0 18px", borderRadius: "var(--radius-sm)", background: "var(--rose-400)", color: "white", border: "none", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--fg1)", margin: 0 }}>劃假月曆</h1>
          <p style={{ fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" }}>點選日期的診別來標記希望休假，需填寫理由</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={navBtnStyle}>‹</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg1)", minWidth: 90, textAlign: "center" }}>{year} 年 {month} 月</span>
          <button onClick={() => navigate(1)} style={navBtnStyle}>›</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 16px", background: "var(--surface-tint)", borderRadius: "var(--radius-md)", margin: "0 0 18px", fontSize: 13, color: "var(--fg2)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {SESSIONS.map((s) => (
            <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 26, height: 22, borderRadius: 5, background: SESSION_BG[s.key], border: `1.5px solid ${SESSION_BORDER[s.key]}`, display: "inline-block" }} />
              <span style={{ color: SESSION_COLOR[s.key], fontWeight: 600 }}>{s.label}</span>
            </span>
          ))}
        </div>
        <span style={{ color: "var(--fg3)" }}>·</span>
        <span style={{ fontWeight: 600, color: totalMarked > 0 ? "var(--rose-600)" : "var(--fg3)" }}>已標記 {totalMarked} 個診別</span>
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, padding: "4px 0", color: i === 0 || i === 6 ? "var(--rose-500)" : "var(--fg3)" }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayOfWeek = (firstDayOfWeek + i) % 7;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const markedSessions = SESSIONS.filter((s) => markedMap.has(markedKey(dateStr, s.key)));
          const hasAny = markedSessions.length > 0;

          return (
            <div key={day} style={{ minHeight: 90, borderRadius: "var(--radius-md)", border: hasAny ? "1.5px solid var(--rose-300)" : "1px solid var(--border)", background: hasAny ? "var(--rose-50, #fff8f8)" : "var(--bg-raised)", padding: "8px 6px", display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, alignSelf: "flex-end", color: isWeekend ? "var(--rose-500)" : "var(--fg2)" }}>{day}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {SESSIONS.map((s) => {
                  const key = markedKey(dateStr, s.key);
                  const isMarked = markedMap.has(key);
                  const isBusy = busy === key;
                  const reason = markedMap.get(key);

                  return (
                    <button key={s.key} onClick={() => handleDayClick(dateStr, s.key)} disabled={isBusy || busy !== null} title={isMarked && reason ? `理由：${reason}` : undefined} style={{ width: "100%", height: 22, borderRadius: 5, border: isMarked ? `1.5px solid ${SESSION_BORDER[s.key]}` : "1px solid var(--border)", background: isMarked ? SESSION_BG[s.key] : "transparent", color: isMarked ? SESSION_COLOR[s.key] : "var(--fg3)", fontSize: 11, fontWeight: isMarked ? 700 : 400, cursor: busy !== null ? "wait" : "pointer", transition: "all .12s", opacity: isBusy ? 0.5 : 1, padding: 0 }}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SESSION_BG: Record<SessionKey, string> = { morning: "var(--clay-100, #f5ebe0)", afternoon: "var(--mist-100, #e8f0f5)", evening: "var(--rose-100, #fce8e8)" };
const SESSION_BORDER: Record<SessionKey, string> = { morning: "var(--clay-300, #d4a87a)", afternoon: "var(--mist-300, #90b8cc)", evening: "var(--rose-300, #e8a0a0)" };
const SESSION_COLOR: Record<SessionKey, string> = { morning: "var(--clay-700, #7a4f28)", afternoon: "var(--mist-700, #2a6080)", evening: "var(--rose-700, #8a3030)" };
const navBtnStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-raised)", cursor: "pointer", color: "var(--fg2)", fontSize: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" };
