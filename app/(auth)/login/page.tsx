"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("帳號或密碼錯誤，請重新輸入。");
    } else {
      router.push("/schedule");
      router.refresh();
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--bg-raised)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          padding: "40px 36px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              background: "var(--sage-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="3"
                stroke="white"
                strokeWidth="1.75"
              />
              <path
                d="M8 2v4M16 2v4M3 10h18"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                d="M8 14h2M14 14h2M8 18h2M14 18h2"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 20,
                color: "var(--fg1)",
              }}
            >
              排班助理
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "var(--sage-500)",
              }}
            >
              SHIFT ASSISTANT
            </div>
          </div>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--fg1)",
            margin: "0 0 6px",
          }}
        >
          歡迎回來
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--fg3)",
            margin: "0 0 28px",
          }}
        >
          請登入您的帳號繼續使用
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--fg2)",
                marginBottom: 6,
              }}
            >
              電子信箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: "100%",
                height: 44,
                padding: "0 14px",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid var(--border)",
                background: "var(--bg)",
                fontSize: 14.5,
                color: "var(--fg1)",
                outline: "none",
                transition: "border-color .15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--sage-400)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--fg2)",
                marginBottom: 6,
              }}
            >
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
              required
              style={{
                width: "100%",
                height: 44,
                padding: "0 14px",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid var(--border)",
                background: "var(--bg)",
                fontSize: 14.5,
                color: "var(--fg1)",
                outline: "none",
                transition: "border-color .15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--sage-400)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--danger-soft)",
                color: "var(--danger)",
                fontSize: 13.5,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 46,
              borderRadius: "var(--radius-md)",
              background: loading ? "var(--sage-300)" : "var(--sage-500)",
              color: "white",
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background .15s",
              marginTop: 4,
            }}
          >
            {loading ? "登入中..." : "登入"}
          </button>
        </form>
      </div>
    </div>
  );
}
