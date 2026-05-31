"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LeaveRequest {
  id: string;
  date: Date | string;
  reason: string | null;
  status: string;
  assistant: { id: string; user: { name: string } };
}

interface Props {
  leaveRequests: LeaveRequest[];
  isAdmin: boolean;
  myAssistantId: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待審核",
  APPROVED: "已核准",
  REJECTED: "已拒絕",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "var(--warning)",
  APPROVED: "var(--success)",
  REJECTED: "var(--danger)",
};
const STATUS_BG: Record<string, string> = {
  PENDING: "var(--warning-soft)",
  APPROVED: "var(--success-soft)",
  REJECTED: "var(--danger-soft)",
};

export default function LeaveView({ leaveRequests, isAdmin, myAssistantId }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!myAssistantId) return;
    setSubmitting(true);
    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason, assistantId: myAssistantId }),
    });
    setSubmitting(false);
    if (!res.ok) {
      alert("送出失敗，請稍後再試。");
      return;
    }
    setShowForm(false);
    setDate("");
    setReason("");
    router.refresh();
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/leave/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      alert("更新失敗，請稍後再試。");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ padding: "28px 32px 40px", maxWidth: 860 }}>
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
            請假申請
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg3)", margin: "4px 0 0" }}>
            {isAdmin ? `共 ${leaveRequests.length} 筆申請` : "管理您的請假紀錄"}
          </p>
        </div>
        {!isAdmin && myAssistantId && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              height: 38,
              padding: "0 18px",
              borderRadius: "var(--radius-md)",
              background: "var(--sage-500)",
              color: "white",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            申請請假
          </button>
        )}
      </div>

      {/* New leave form */}
      {showForm && (
        <div
          style={{
            padding: "20px 24px",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-raised)",
            border: "1px solid var(--border)",
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
            新增請假申請
          </h3>
          <form onSubmit={submitLeave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>請假日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>原因（選填）</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例：就醫、家事"
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  height: 38,
                  padding: "0 20px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--sage-500)",
                  color: "white",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "送出中..." : "送出申請"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: "var(--radius-md)",
                  background: "transparent",
                  color: "var(--fg2)",
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave list */}
      {leaveRequests.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "var(--fg3)",
            fontSize: 15,
          }}
        >
          目前沒有請假紀錄
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-raised)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {leaveRequests.map((req, idx) => (
            <div
              key={req.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom:
                  idx < leaveRequests.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                gap: 16,
              }}
            >
              {isAdmin && (
                <div style={{ width: 72, flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--sage-100)",
                      color: "var(--sage-700)",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {req.assistant.user.name.slice(-2)}
                  </span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                {isAdmin && (
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--fg1)",
                      marginBottom: 2,
                    }}
                  >
                    {req.assistant.user.name}
                  </div>
                )}
                <div style={{ fontSize: 14, color: "var(--fg2)" }}>
                  {String(req.date).slice(0, 10).replace(/-/g, " / ")}
                </div>
                {req.reason && (
                  <div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 2 }}>
                    {req.reason}
                  </div>
                )}
              </div>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: STATUS_BG[req.status],
                  color: STATUS_COLOR[req.status],
                  flexShrink: 0,
                }}
              >
                {STATUS_LABEL[req.status]}
              </span>
              {isAdmin && req.status === "PENDING" && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => updateStatus(req.id, "APPROVED")}
                    style={{
                      height: 30,
                      padding: "0 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--success-soft)",
                      color: "var(--success)",
                      border: "none",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    核准
                  </button>
                  <button
                    onClick={() => updateStatus(req.id, "REJECTED")}
                    style={{
                      height: 30,
                      padding: "0 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--danger-soft)",
                      color: "var(--danger)",
                      border: "none",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    拒絕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--fg2)",
  marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--border)",
  background: "var(--bg)",
  fontSize: 14,
  color: "var(--fg1)",
  outline: "none",
};
