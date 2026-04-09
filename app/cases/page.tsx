"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FolderOpen, Plus, Trash2, X } from "lucide-react";

const BRAND = "#2D6A4F";
const DOMAINS = ["Autism Spectrum","Sensory Processing","Fine/Gross Motor","Enuresis","Language & Comm.","Daily Living Skills","Behavioral / Emotional","Feeding & Oral Motor"];

export default function CasesPage() {
  const cases = useQuery(api.cases.list) ?? [];
  const createCase = useMutation(api.cases.create);
  const removeCase = useMutation(api.cases.remove);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", dob: "", primaryDomain: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await createCase({ name: form.name.trim(), dob: form.dob || undefined, primaryDomain: form.primaryDomain || undefined, notes: form.notes || undefined });
    setForm({ name: "", dob: "", primaryDomain: "", notes: "" });
    setShowForm(false);
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F6F1" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #EDEBE4", padding: "20px 28px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontFamily: "'Source Serif 4',serif", fontSize: 22, fontWeight: 800, color: "#1C2B24", margin: 0, letterSpacing: "-0.3px" }}>My Cases</h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#A0A89E", margin: "2px 0 0" }}>Patient and caseload folders</p>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, border: "none", background: BRAND, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> New Case
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 80px" }}>
        {cases.length === 0 && !showForm ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EEF6F1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FolderOpen size={24} color={BRAND} strokeWidth={1.6} />
            </div>
            <div style={{ fontFamily: "'Source Serif 4',serif", fontSize: 18, fontWeight: 700, color: "#1C2B24", marginBottom: 8 }}>No cases yet</div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "#8A8880", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 20px" }}>
              Create a folder for each patient or caseload group. Searches and clinical tools you generate will link here.
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: BRAND, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={15} /> Create your first case
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {cases.map((c) => (
              <div key={c._id} style={{ background: "#fff", border: "1px solid #EDEBE4", borderRadius: 12, padding: "18px 20px", position: "relative" }}>
                <button onClick={() => removeCase({ id: c._id })}
                  style={{ position: "absolute", top: 12, right: 12, border: "none", background: "none", cursor: "pointer", color: "#C2BEB6", padding: 4 }}>
                  <Trash2 size={13} />
                </button>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF6F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <FolderOpen size={18} color={BRAND} strokeWidth={1.8} />
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "#1C2B24", marginBottom: 4 }}>{c.name}</div>
                {c.primaryDomain && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: BRAND, fontWeight: 500, marginBottom: 4 }}>{c.primaryDomain}</div>}
                {c.dob && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#A0A89E" }}>DOB: {c.dob}</div>}
                {c.notes && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#6B7C74", lineHeight: 1.5, marginTop: 8, borderTop: "1px solid #F0EDE6", paddingTop: 8 }}>{c.notes}</p>}
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#C2BEB6", marginTop: 10 }}>
                  Created {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New case modal */}
        {showForm && (
          <>
            <div onClick={() => setShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(480px,92vw)", background: "#fff", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.16)", zIndex: 101, padding: "28px 28px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h2 style={{ fontFamily: "'Source Serif 4',serif", fontSize: 18, fontWeight: 700, color: "#1C2B24", margin: 0 }}>New Case</h2>
                <button onClick={() => setShowForm(false)} style={{ border: "none", background: "#F5F3EE", borderRadius: 7, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={15} color="#888" />
                </button>
              </div>
              {[
                { label: "Patient name or identifier *", key: "name", type: "text", placeholder: "e.g. Liam T. or Case #42" },
                { label: "Date of birth", key: "dob", type: "date", placeholder: "" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#A0A89E", display: "block", marginBottom: 6 }}>{label}</label>
                  <input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #DEDBD4", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "#1C2B24", outline: "none", background: "#fff" }} />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#A0A89E", display: "block", marginBottom: 6 }}>Primary domain</label>
                <select value={form.primaryDomain} onChange={e => setForm(f => ({ ...f, primaryDomain: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #DEDBD4", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "#1C2B24", background: "#fff" }}>
                  <option value="">Select domain…</option>
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#A0A89E", display: "block", marginBottom: 6 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Any relevant context…"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #DEDBD4", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "#1C2B24", resize: "vertical", outline: "none", background: "#fff" }} />
              </div>
              <button onClick={handleCreate} disabled={!form.name.trim() || saving}
                style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: form.name.trim() ? BRAND : "#C2BEB6", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, cursor: form.name.trim() ? "pointer" : "not-allowed" }}>
                {saving ? "Saving…" : "Create Case"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
