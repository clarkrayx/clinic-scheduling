"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  defaultYear: number;
  defaultMonth: number;
  assistantCount: number;
  ruleCount: number;
}

export default function GenerateView({
  defaultYear,
  defaultMonth,
  assistantCount,
  ruleCount,
}: Props) {
  const router = useRouter();
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    notes?: string;
  } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: `成功產生 ${year} 年 ${month} 月班表，共安排 ${data.assignmentCount} 個班次。`,
          notes: data.notes,
        });
      } else {
        setResult({
          success: false,
          message: data.error ?? "排班失敗，請稍後再試。",
        });
      }
    } catch {
      setResult({ success: false, message: "連線錯誤，請稍後再試。" });
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    await fetch("/api/schedule/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });
    router.push(`/schedule?year=${year}&month=${month}`);
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 680 }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 700,
          color: "var(--fg1)",
          margin: "0 0 6px",
        }}
      >
        AI 自動排班
      </h1>
      <p style={{ fontSize: 14, color: "var(--fg3)", margin: "0 0 28px" }}>
        根據診次設定、助理偏好及請假資料，由 AI 自動產生最佳班表。
      </p>

      {/* Status cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <StatCard label="可排班助理" value={assistantCount} unit="人" />
        <StatCard label="特殊規則" value={ruleCount} unit="條" />
      </div>

      {/* Config */}
      <div
        style={{
          background: "var(--bg-raised)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          padding: "24px",
          marginBottom: 20,
        }}
      >
        <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>
          選擇排班月份
        </h3>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div>
            <label style={labelStyle}>年份</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              style={selectStyle}
            >
              {[defaultYear - 1, defaultYear, defaultYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y} 年
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>月份</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              style={selectStyle}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m} 月
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "var(--radius-md)",
          background: "var(--surface-tint)",
          border: "1px solid var(--sage-200)",
          marginBottom: 24,
          fontSize: 13.5,
          color: "var(--fg2)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--sage-700)" }}>排班前請確認：</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
          <li>已設定本月所有開診日及診次</li>
          <li>已確認所有助理請假申請</li>
          <li>特殊規則已設定完整</li>
        </ul>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          height: 48,
          padding: "0 28px",
          borderRadius: "var(--radius-md)",
          background: loading ? "var(--sage-300)" : "var(--sage-500)",
          color: "white",
          border: "none",
          fontSize: 15.5,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 9,
          transition: "background .15s",
        }}
      >
        {loading ? (
          <>
            <SpinnerIcon />
            AI 排班中，請稍候...
          </>
        ) : (
          <>✦ 開始自動排班</>
        )}
      </button>

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: "18px 22px",
            borderRadius: "var(--radius-lg)",
            background: result.success ? "var(--success-soft)" : "var(--danger-soft)",
            border: `1px solid ${result.success ? "#b5d4bb" : "#e8c0c0"}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14.5,
              fontWeight: 600,
              color: result.success ? "var(--success)" : "var(--danger)",
            }}
          >
            {result.message}
          </p>
          {result.notes && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: "var(--fg2)",
                whiteSpace: "pre-wrap",
              }}
            >
              {result.notes}
            </p>
          )}
          {result.success && (
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={() =>
                  router.push(`/schedule?year=${year}&month=${month}`)
                }
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--success)",
                  color: "white",
                  border: "none",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                查看草稿班表
              </button>
              <button
                onClick={handlePublish}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: "var(--radius-md)",
                  background: "white",
                  color: "var(--success)",
                  border: "1.5px solid var(--success)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                立即發布
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: 12.5, color: "var(--fg3)", fontWeight: 500 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          color: "var(--sage-600)",
          marginTop: 4,
        }}
      >
        {value}
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg3)", marginLeft: 4 }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--fg2)",
  marginBottom: 5,
};
const selectStyle: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--border)",
  background: "var(--bg)",
  fontSize: 14,
  color: "var(--fg1)",
  cursor: "pointer",
  outline: "none",
};
