"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  { href: "/search",    icon: Search,     label: "Search",    soon: false, auth: false },
  { href: "/cases",     icon: FolderOpen, label: "My Cases",  soon: false, auth: true  },
  { href: "/library",   icon: BookOpen,   label: "Library",   soon: false, auth: true  },
  { href: "/templates", icon: FileText,   label: "Templates", soon: false, auth: true  },
  { href: "/team",      icon: Users,      label: "Team",      soon: true,  auth: true  },
];

function NavContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const getOrCreate = useMutation(api.users.getOrCreate);

  useEffect(() => {
    if (isSignedIn) getOrCreate().catch(() => {});
  }, [isSignedIn, getOrCreate]);

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
        {NAV.map(({ href, icon: Icon, label, soon, auth }) => {
          const active = pathname === href || (href === "/search" && pathname === "/");
          const locked = auth && !isSignedIn;
          return (
            <Link key={href} href={locked || soon ? "#" : href}
              onClick={locked || soon ? (e) => e.preventDefault() : onNav}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, marginBottom: 1,
                textDecoration: "none",
                background: active ? BRAND_BG : "transparent",
                color: active ? BRAND : (locked || soon) ? "#C2BEB6" : "#4A5568",
                fontFamily: "'DM Sans',sans-serif", fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                transition: "background 0.1s, color 0.1s",
                cursor: (locked || soon) ? "default" : "pointer",
              }}>
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {soon && <span style={{ fontSize: 10, fontWeight: 600, color: "#C5BFB6", background: "#F4F2EE", padding: "2px 6px", borderRadius: 8 }}>Soon</span>}
              {locked && !soon && <span style={{ fontSize: 12, color: "#C5BFB6" }}>🔒</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid #EDEBE4", padding: "10px" }}>
        {isSignedIn ? (
          <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, textDecoration: "none", color: "#8A8880", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5 }}>
            <Settings size={16} strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
        ) : null}
        <div style={{ padding: "10px 12px", marginTop: 2 }}>
          {isSignedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <UserButton />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, fontWeight: 600, color: "#2C2825", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.firstName ?? user.emailAddresses[0]?.emailAddress}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#A0A89E" }}>
                  {user.primaryEmailAddress?.emailAddress}
                </div>
              </div>
            </div>
          ) : (
            <SignInButton mode="modal">
              <button style={{ width: "100%", padding: "9px 14px", borderRadius: 8, border: `1.5px solid ${BRAND}`, background: BRAND, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="seedling-sidebar" style={{ width: 220, flexShrink: 0, background: "#fff", borderRight: "1px solid #EDEBE4", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        <NavContent />
      </div>
      <button className="sidebar-hamburger" onClick={() => setOpen(true)}
        style={{ position: "fixed", top: 14, left: 14, zIndex: 900, width: 38, height: 38, borderRadius: 9, background: "#fff", border: "1px solid #EDEBE4", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "none" }}>
        <Menu size={18} color="#4A5568" />
      </button>
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
