import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
  features: string[];
}

export default function ComingSoon({ icon: Icon, title, description, phase, features }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#F7F6F1", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 24px" }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDEBE4", padding: "40px 36px", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EEF6F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Icon size={26} color="#2D6A4F" strokeWidth={1.8} />
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF8ED", border: "1px solid #F0DFB0", borderRadius: 20, padding: "4px 12px", marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#9A7028", letterSpacing: "0.5px" }}>{phase}</span>
          </div>
          <h1 style={{ fontFamily: "'Source Serif 4',serif", fontSize: 26, fontWeight: 800, color: "#1C2B24", marginBottom: 10, letterSpacing: "-0.3px" }}>{title}</h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#6B7C74", lineHeight: 1.65, marginBottom: 28 }}>{description}</p>
          <div style={{ borderTop: "1px solid #EDEBE4", paddingTop: 24 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#B0ADA6", marginBottom: 14 }}>What to expect</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#EEF6F1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "#4A5568", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#C2BEB6", textAlign: "center", marginTop: 20 }}>
          Use Search now → new features added in upcoming releases
        </p>
      </div>
    </div>
  );
}
