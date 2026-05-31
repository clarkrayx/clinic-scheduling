"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "發生錯誤，請稍後再試"); return; }

    if (data.token) {
      const origin = window.location.origin;
      setResetLink(`${origin}/reset-password?token=${data.token}`);
    } else {
      // Email not found — show generic message (avoid enumeration)
      setResetLink("NOT_FOUND");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--bg-raised)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", padding: "40px 36px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--sage-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="1.75"/><path d="M8 2v4M16 2v4M3 10h18" stroke="white" strokeWidth="1.75" strokeLinecap="round"/><path d="M8 14h2M14 14h2M8 18h2M14 18h2" stroke="white" strokeWidth="1.75" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--fg1)" }}>品叡品沐</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sage-500)" }}>PINRAY DENTAL CARE</div>
          </div>
        </div>

        {resetLink ? (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg1)", margin: "0 0 12px" }}>重設連結已產生</h2>
            {resetLink === "NOT_FOUND" ? (
              <p style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.7, margin: "0 0 24px" }}>
                如果此 Email 已在系統中，您將會收到重設連結。<br />
                若找不到帳號，請聯絡診所管理者。
              </p>
            ) : (
              <>
                <p style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.7, margin: "0 0 12px" }}>
                  請複製以下連結，於 <strong>1 小時內</strong>完成密碼重設：
                </p>
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "#f5f5f0", border: "1px solid var(--border)", fontSize: 12, color: "var(--fg2)", wordBreak: "break-all", marginBottom: 16 }}>
                  {resetLink}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(resetLink); }}
                  style={{ height: 38, padding: "0 16px", borderRadius: "var(--radius-sm)", background: "var(--sage-500)", color: "white", border: "none", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 20 }}
                >
                  複製連結
                </button>
              </>
            )}
            <div>
              <Link href="/login" style={{ color: "var(--sage-600)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>← 返回登入</Link>
            </div>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg1)", margin: "0 0 6px" }}>忘記密碼</h1>
            <p style={{ fontSize: 14, color: "var(--fg3)", margin: "0 0 24px" }}>輸入帳號 Email，取得密碼重設連結</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>電子信箱</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" style={inputStyle} />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ height: 46, borderRadius: "var(--radius-md)", background: loading ? "var(--sage-300)" : "var(--sage-500)", color: "white", border: "none", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "處理中…" : "取得重設連結"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "var(--fg3)" }}>
              <Link href="/login" style={{ color: "var(--sage-600)", fontWeight: 600, textDecoration: "none" }}>← 返回登入</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14.5, color: "var(--fg1)", outline: "none" };
