"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search, FolderOpen, BookOpen, FileText, Users, Settings, Menu, X } from "lucide-react";

const BRAND = "#2D6A4F";
const BRAND_BG = "#EEF6F1";

const SeedlingMark = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path d="M13 24V11" stroke={BRAND} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M13 17C11 15 7.5 14 5 11C7.5 10 11 12 13 17Z" fill={BRAND} opacity="0.85"/>
    <path d="M13 13C15 11 18.5 10 21 7C18.5 6 15 8 13 13Z" fill={BRAND}/>
  </svg>
);

const NAV = [
  { href: "/search", icon: Search, label: "Search", soon: false },
  { href: "/cases", icon: FolderOpen, label: "My Cases", soon: true },
  { href: "/library", icon: BookOpen, label: "Library", soon: true },
  { href: "/templates", icon: FileText, label: "Templates", soon: true },
  { href: "/team", icon: Users, label: "Team", soon: true },
];

function NavContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Wordmark */}
      <div style={{ padding: "22px 18px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <SeedlingMark />
        <span style={{ fontFamily: "'Source Serif 4',serif", fontSize: 20, fontWeight: 800, color: "#1C2B24", letterSpacing: "-0.3px" }}>Seedling</span>
      </div>
      <div style={{ height: 1, background: "#EDEBE4", margin: "0 0 8px" }} />

      {/* Nav */}
      <nav style={{ padding: "6px 10px", flex: 1 }}>
        {NAV.map(({ href, icon: Icon, label, soon }) => {
          const active = pathname === href || (href === "/search" && pathname === "/");
          return (
            <Link key={href} href={soon ? "#" : href}
              onClick={soon ? (e) => e.preventDefault() : onNav}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, marginBottom: 1,
                textDecoration: "none",
                background: active ? BRAND_BG : "transparent",
                color: active ? BRAND : soon ? "#C2BEB6" : "#4A5568",
                fontFamily: "'DM Sans',sans-serif", fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                transition: "background 0.1s, color 0.1s",
                cursor: soon ? "default" : "pointer",
              }}>
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {soon && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "#C5BFB6", background: "#F4F2EE", padding: "2px 6px", borderRadius: 8 }}>
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid #EDEBE4", padding: "10px" }}>
        <Link href="/settings"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, textDecoration: "none", color: "#8A8880", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, transition: "background 0.1s" }}>
          <Settings size={16} strokeWidth={1.8} />
          <span>Settings</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginTop: 2 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: BRAND_BG, border: `1.5px solid ${BRAND}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: BRAND, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
            ?
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, fontWeight: 600, color: "#2C2825" }}>Sign in</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#B0ADA6" }}>coming in Phase 2</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop */}
      <div className="seedling-sidebar" style={{ width: 220, flexShrink: 0, background: "#fff", borderRight: "1px solid #EDEBE4", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        <NavContent />
      </div>

      {/* Mobile hamburger */}
      <button className="sidebar-hamburger" onClick={() => setOpen(true)}
        style={{ position: "fixed", top: 14, left: 14, zIndex: 900, width: 38, height: 38, borderRadius: 9, background: "#fff", border: "1px solid #EDEBE4", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "none" }}>
        <Menu size={18} color="#4A5568" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 1000 }} />
          <div style={{ position: "fixed", top: 0, left: 0, width: 248, height: "100vh", background: "#fff", zIndex: 1001, overflowY: "auto", boxShadow: "4px 0 28px rgba(0,0,0,0.12)" }}>
            <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 14, right: 14, border: "none", background: "none", cursor: "pointer", padding: 4 }}>
              <X size={18} color="#888" />
            </button>
            <NavContent onNav={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
