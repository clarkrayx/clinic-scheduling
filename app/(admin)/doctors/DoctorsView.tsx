"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
}

export default function DoctorsView({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState<Doctor | null>(null);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openNew() {
    setEditDoc(null);
    setName("");
    setSpecialty("");
    setPhone("");
    setNotes("");
    setShowForm(true);
  }

  function openEdit(doc: Doctor) {
    setEditDoc(doc);
    setName(doc.name);
    setSpecialty(doc.specialty ?? "");
    setPhone(doc.phone ?? "");
    setNotes(doc.notes ?? "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    if (editDoc) {
      await fetch(`/api/doctors/${editDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty, phone, notes }),
      });
    } else {
      await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty, phone, notes }),
      });
    }
    setSubmitting(false);
    setShowForm(false);
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
          <h1 style={h1Style}>醫師管理</h1>
          <p style={subStyle}>共 {doctors.length} 位醫師</p>
        </div>
        <button onClick={openNew} style={primaryBtnStyle}>
          新增醫師
        </button>
      </div>

      {showForm && (
        <div style={formCardStyle}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
            {editDoc ? "編輯醫師" : "新增醫師"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>姓名 *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="醫師姓名" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>科別</label>
                <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle} placeholder="例：牙科" />
              </div>
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>電話</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="聯絡電話" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>備注</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} placeholder="其他備注" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" disabled={submitting} style={primaryBtnStyle}>
                {submitting ? "儲存中..." : "儲存"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={ghostBtnStyle}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {doctors.length === 0 ? (
        <div style={emptyStyle}>尚未新增任何醫師</div>
      ) : (
        <div style={tableCardStyle}>
          {doctors.map((doc, idx) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: idx < doctors.length - 1 ? "1px solid var(--border)" : "none",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "var(--mist-100)",
                  color: "var(--mist-700)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {doc.name.slice(-1)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg1)" }}>
                  {doc.name} 醫師
                </div>
                {doc.specialty && (
                  <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 1 }}>
                    {doc.specialty}
                  </div>
                )}
              </div>
              {doc.phone && (
                <div style={{ fontSize: 13, color: "var(--fg3)" }}>{doc.phone}</div>
              )}
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 12,
                  fontWeight: 600,
                  background: doc.isActive ? "var(--success-soft)" : "var(--neutral-100)",
                  color: doc.isActive ? "var(--success)" : "var(--fg3)",
                }}
              >
                {doc.isActive ? "在職" : "停用"}
              </span>
              <button onClick={() => openEdit(doc)} style={editBtnStyle}>
                編輯
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const h1Style: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 26,
  fontWeight: 700,
  color: "var(--fg1)",
  margin: 0,
};
const subStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--fg3)",
  margin: "4px 0 0",
};
const primaryBtnStyle: React.CSSProperties = {
  height: 38,
  padding: "0 18px",
  borderRadius: "var(--radius-md)",
  background: "var(--sage-500)",
  color: "white",
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const ghostBtnStyle: React.CSSProperties = {
  height: 38,
  padding: "0 16px",
  borderRadius: "var(--radius-md)",
  background: "transparent",
  color: "var(--fg2)",
  border: "1px solid var(--border)",
  fontSize: 14,
  cursor: "pointer",
};
const editBtnStyle: React.CSSProperties = {
  height: 30,
  padding: "0 12px",
  borderRadius: "var(--radius-sm)",
  background: "var(--neutral-100)",
  color: "var(--fg2)",
  border: "1px solid var(--border)",
  fontSize: 12.5,
  cursor: "pointer",
};
const formCardStyle: React.CSSProperties = {
  padding: "20px 24px",
  borderRadius: "var(--radius-lg)",
  background: "var(--bg-raised)",
  border: "1px solid var(--border)",
  marginBottom: 20,
};
const tableCardStyle: React.CSSProperties = {
  background: "var(--bg-raised)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  overflow: "hidden",
};
const emptyStyle: React.CSSProperties = {
  padding: "60px 20px",
  textAlign: "center",
  color: "var(--fg3)",
  fontSize: 15,
};
const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
};
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
