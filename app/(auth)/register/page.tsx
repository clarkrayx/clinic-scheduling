"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("兩次輸入的密碼不一致"); return; }
    if (password.length < 8) { setError("密碼至少需要 8 個字元"); return; }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "申請失敗，請稍後再試"); return; }
    setDone(true);
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

        {done ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg1)", margin: "0 0 10px" }}>帳號申請已送出</h2>
            <p style={{ fontSize: 14, color: "var(--fg3)", lineHeight: 1.7, margin: "0 0 24px" }}>
              請等待診所管理者審核，<br />審核通過後即可使用此帳號登入。
            </p>
            <Link href="/login" style={{ color: "var(--sage-600)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              ← 返回登入
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg1)", margin: "0 0 6px" }}>申請助理帳號</h1>
            <p style={{ fontSize: 14, color: "var(--fg3)", margin: "0 0 24px" }}>填寫資料後由管理者審核開通</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>姓名 *</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="您的真實姓名" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>電子信箱 *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>密碼 *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="至少 8 個字元" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>確認密碼 *</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="再次輸入密碼" style={inputStyle} />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ height: 46, borderRadius: "var(--radius-md)", background: loading ? "var(--sage-300)" : "var(--sage-500)", color: "white", border: "none", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
                {loading ? "申請中…" : "送出申請"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "var(--fg3)" }}>
              已有帳號？{" "}
              <Link href="/login" style={{ color: "var(--sage-600)", fontWeight: 600, textDecoration: "none" }}>登入</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14.5, color: "var(--fg1)", outline: "none" };
