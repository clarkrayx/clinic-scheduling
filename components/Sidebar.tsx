"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getDaysInMonth, startOfMonth, addMonths } from "date-fns";

const NAV_ITEMS = [
  { href: "/schedule", icon: CalendarIcon, label: "月排班" },
];

const ADMIN_ITEMS = [
  { href: "/doctors", icon: UserIcon, label: "醫師管理" },
  { href: "/assistants", icon: UsersIcon, label: "助理管理" },
  { href: "/clinic-days", icon: ClipboardIcon, label: "開診設定" },
  { href: "/preference-overview", icon: HeartIcon, label: "劃假總覽" },
  { href: "/rules", icon: SettingsIcon, label: "排班規則" },
  { href: "/generate", icon: SparklesIcon, label: "自動排班" },
];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.FC<{ size?: number }>;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        color: active ? "var(--sage-700)" : "var(--fg2)",
        background: active ? "var(--brand-soft)" : "transparent",
        fontWeight: active ? 600 : 500,
        fontSize: 14.5,
        textDecoration: "none",
        transition: "background .15s, color .15s",
      }}
    >
      <Icon size={19} />
      <span>{label}</span>
    </Link>
  );
}

function SidebarLeaveCalendar({ assistantId }: { assistantId: string }) {
  const nextMonth = addMonths(new Date(), 1);
  const [year, setYear] = useState(nextMonth.getFullYear());
  const [month, setMonth] = useState(nextMonth.getMonth() + 1);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchPreferences = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/preference-days?year=${y}&month=${m}&assistantId=${assistantId}`);
      if (res.ok) {
        const data: { date: string }[] = await res.json();
        setMarked(new Set(data.map((d) => d.date.slice(0, 10))));
      }
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  useEffect(() => {
    fetchPreferences(year, month);
  }, [year, month, fetchPreferences]);

  function navigate(dir: number) {
    let y = year, m = month + dir;
    if (m > 12) { y++; m = 1; }
    if (m < 1) { y--; m = 12; }
    setYear(y);
    setMonth(m);
  }

  async function toggleDay(dateStr: string) {
    if (busy || loading) return;
    setBusy(true);
    if (marked.has(dateStr)) {
      const res = await fetch(`/api/preference-days/${dateStr}?assistantId=${assistantId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMarked((prev) => { const next = new Set(prev); next.delete(dateStr); return next; });
      }
    } else {
      const res = await fetch("/api/preference-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, assistantId }),
      });
      if (res.ok) {
        setMarked((prev) => new Set([...prev, dateStr]));
      }
    }
    setBusy(false);
  }

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = startOfMonth(new Date(year, month - 1)).getDay();

  return (
    <div style={{ marginTop: 4 }}>
      {/* Section label + month nav */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        color: "var(--fg3)", padding: "12px 12px 6px",
        textTransform: "uppercase", display: "flex",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <span>劃假月曆</span>
        <div style={{ display: "flex", gap: 3 }}>
          <button onClick={() => navigate(-1)} style={miniNavBtn}>‹</button>
          <button onClick={() => navigate(1)} style={miniNavBtn}>›</button>
        </div>
      </div>

      <div style={{
        fontSize: 12, fontWeight: 600, color: "var(--fg2)",
        textAlign: "center", padding: "0 12px 6px",
      }}>
        {year} 年 {month} 月
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px", gap: 2 }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: "center", fontSize: 10, fontWeight: 600, padding: "2px 0",
            color: i === 0 || i === 6 ? "var(--rose-400)" : "var(--fg3)",
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        gap: 2, padding: "2px 8px",
        opacity: loading ? 0.5 : 1,
        transition: "opacity .15s",
      }}>
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
              disabled={busy || loading}
              title={isMarked ? `取消 ${dateStr} 劃假` : `標記 ${dateStr} 為希望休假`}
              style={{
                height: 26,
                borderRadius: 5,
                border: "none",
                background: isMarked ? "var(--rose-400)" : "transparent",
                cursor: busy || loading ? "wait" : "pointer",
                fontSize: 11,
                fontWeight: isMarked ? 700 : 400,
                color: isMarked ? "white" : isWeekend ? "var(--rose-500)" : "var(--fg2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "background .12s, color .12s",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <div style={{
        fontSize: 11, textAlign: "center",
        padding: "6px 12px 4px",
        color: marked.size > 0 ? "var(--rose-600)" : "var(--fg3)",
        fontWeight: marked.size > 0 ? 600 : 400,
      }}>
        {loading ? "載入中…" : marked.size > 0 ? `已劃假 ${marked.size} 天` : "點選日期來劃假"}
      </div>

      <div style={{ margin: "10px 12px 0", borderBottom: "1px solid var(--border)" }} />
    </div>
  );
}

interface SidebarProps {
  userName: string;
  userRole: string;
  isAdmin: boolean;
  assistantId: string | null;
}

export default function Sidebar({ userName, userRole, isAdmin, assistantId }: SidebarProps) {
  const initials = userName.slice(-2);

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        background: "var(--bg-raised)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
        gap: 2,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "4px 8px 18px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-sm)",
            background: "var(--sage-500)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="1.75" />
            <path d="M8 2v4M16 2v4M3 10h18" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
            <path d="M8 14h2M14 14h2M8 18h2" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 17,
              color: "var(--fg1)",
            }}
          >
            排班助理
          </div>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--sage-500)",
            }}
          >
            SHIFT ASSISTANT
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>

      {/* Leave calendar for assistants */}
      {!isAdmin && assistantId && (
        <SidebarLeaveCalendar assistantId={assistantId} />
      )}

      {/* Admin nav */}
      {isAdmin && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--fg3)",
              padding: "14px 12px 6px",
              textTransform: "uppercase",
            }}
          >
            管理設定
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {ADMIN_ITEMS.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </>
      )}

      {/* User */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 10px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "var(--sage-600)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ lineHeight: 1.25, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--fg1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg3)" }}>{userRole}</div>
        </div>
      </div>
    </aside>
  );
}

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function HeartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function UserIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function UsersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 20c0-3.3-2.1-6-5-6.5" />
    </svg>
  );
}
function ClipboardIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </svg>
  );
}
function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function SparklesIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
    </svg>
  );
}

const miniNavBtn: React.CSSProperties = {
  width: 20, height: 20, borderRadius: 4,
  border: "1px solid var(--border)", background: "transparent",
  cursor: "pointer", color: "var(--fg3)", fontSize: 13,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  lineHeight: 1, padding: 0,
};
