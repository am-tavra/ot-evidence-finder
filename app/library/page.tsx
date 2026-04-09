"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BookOpen, Bookmark, Clock, Trash2, ExternalLink } from "lucide-react";

const BRAND = "#2D6A4F";

export default function LibraryPage() {
  const [tab, setTab] = useState<"bookmarks" | "searches">("bookmarks");
  const bookmarks = useQuery(api.bookmarks.list) ?? [];
  const searches = useQuery(api.searches.list) ?? [];
  const clearBookmarks = useMutation(api.bookmarks.clearAll);
  const removeSearch = useMutation(api.searches.remove);
  const [expandedSearch, setExpandedSearch] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F6F1" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EDEBE4", padding: "20px 28px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'Source Serif 4',serif", fontSize: 22, fontWeight: 800, color: "#1C2B24", margin: 0, letterSpacing: "-0.3px" }}>Library</h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#A0A89E", margin: "2px 0 0" }}>Your saved articles and search history</p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 80px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #EDEBE4", marginBottom: 24 }}>
          {([["bookmarks", Bookmark, `Bookmarks (${bookmarks.length})`], ["searches", Clock, `Search History (${searches.length})`]] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: tab === id ? 600 : 400, color: tab === id ? BRAND : "#8A8880", border: "none", borderBottom: tab === id ? `2px solid ${BRAND}` : "2px solid transparent", marginBottom: -2, background: "none", cursor: "pointer", borderRadius: "6px 6px 0 0" }}>
              <Icon size={14} strokeWidth={tab === id ? 2.5 : 1.8} />
              {label}
            </button>
          ))}
        </div>

        {/* Bookmarks tab */}
        {tab === "bookmarks" && (
          <div>
            {bookmarks.length === 0 ? (
              <EmptyState icon={Bookmark} title="No bookmarks yet" desc="Bookmark articles during a search and they'll appear here, synced across all your devices." />
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <button onClick={() => clearBookmarks()} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#C44", background: "none", border: "1px solid #EDEBE4", borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}>Clear all</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bookmarks.map((b) => (
                    <div key={b._id} style={{ background: "#fff", border: "1px solid #EDEBE4", borderRadius: 10, padding: "14px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1C2B24", lineHeight: 1.4, marginBottom: 4 }}>{b.title}</div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#8A8880" }}>
                            {b.authors}{b.year ? ` · ${b.year}` : ""}{b.journal ? ` · ${b.journal}` : ""} · {b.source}
                          </div>
                          {b.url && (
                            <a href={b.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: BRAND, fontWeight: 600, marginTop: 6, textDecoration: "none" }}>
                              View article <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                        {b.isTrial && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#6B4C9A", background: "#6B4C9A15", padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>Trial</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Search history tab */}
        {tab === "searches" && (
          <div>
            {searches.length === 0 ? (
              <EmptyState icon={Clock} title="No search history" desc="Your searches and AI syntheses will be saved here automatically once you run your first search." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {searches.map((s) => (
                  <div key={s._id} style={{ background: "#fff", border: "1px solid #EDEBE4", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpandedSearch(expandedSearch === s._id ? null : s._id)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1C2B24" }}>
                            {s.query || s.domainLabel}
                          </span>
                          {s.synthesis && <span style={{ fontSize: 10, fontWeight: 700, color: BRAND, background: "#EEF6F1", padding: "2px 7px", borderRadius: 8 }}>Synthesis saved</span>}
                        </div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#A0A89E", display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <span>{s.domainLabel}</span>
                          <span>·</span>
                          <span>Ages {s.age}</span>
                          <span>·</span>
                          <span>{s.articleCount} articles</span>
                          <span>·</span>
                          <span>{new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                      <button onClick={() => removeSearch({ id: s._id })}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#C2BEB6", padding: 4, flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {expandedSearch === s._id && s.synthesis && (
                      <div style={{ borderTop: "1px solid #F0EDE6", padding: "14px 18px", background: "#FAFAF7" }}>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#B0ADA6", marginBottom: 8 }}>Saved synthesis</div>
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.7, color: "#4A5568", marginBottom: 10 }}>{s.synthesis.overview}</p>
                        <div style={{ background: "#EEF6F1", border: "1px solid #C5E0D0", borderRadius: 8, padding: "10px 14px" }}>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Clinical bottom line</div>
                          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#2D4A3E", lineHeight: 1.6, margin: 0 }}>{s.synthesis.clinical_bottom_line}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EEF6F1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <Icon size={24} color={BRAND} strokeWidth={1.6} />
      </div>
      <div style={{ fontFamily: "'Source Serif 4',serif", fontSize: 18, fontWeight: 700, color: "#1C2B24", marginBottom: 8 }}>{title}</div>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "#8A8880", lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>{desc}</p>
    </div>
  );
}
