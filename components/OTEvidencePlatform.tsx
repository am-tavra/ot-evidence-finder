"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─── CONFIG ─── */
const DOMAINS = [
  { id: "autism", label: "Autism Spectrum", icon: "🧩", color: "#D6603D", mesh: ["autism spectrum disorder", "ASD", "autism intervention"] },
  { id: "sensory", label: "Sensory Processing", icon: "🖐️", color: "#C49A2D", mesh: ["sensory processing disorder", "sensory integration", "sensory diet"] },
  { id: "motor", label: "Fine/Gross Motor", icon: "🏃", color: "#4A8C65", mesh: ["motor skills", "fine motor", "gross motor", "motor development"] },
  { id: "bedwetting", label: "Enuresis", icon: "🌙", color: "#5B72B5", mesh: ["nocturnal enuresis", "bedwetting", "bladder training"] },
  { id: "linguistic", label: "Language & Comm.", icon: "💬", color: "#B54E7A", mesh: ["language development", "speech therapy", "communication disorder"] },
  { id: "adl", label: "Daily Living Skills", icon: "🍽️", color: "#7B5EA7", mesh: ["activities of daily living", "self-care skills", "adaptive behavior"] },
  { id: "behavioral", label: "Behavioral / Emotional", icon: "🧠", color: "#3D8EAE", mesh: ["behavioral intervention", "emotional regulation", "self-regulation"] },
  { id: "feeding", label: "Feeding & Oral Motor", icon: "🥄", color: "#AE6B3D", mesh: ["pediatric feeding disorder", "oral motor", "food selectivity"] },
];
const AGES = ["3", "4", "5", "6", "3-4", "5-6", "3-6"];
const EV_LEVELS = ["Any Level", "Systematic Review", "RCT", "Cohort / Case-Control", "Case Series"];

/* ─── API MODULES ─── */
const buildAgeTerms = (age: string) => {
  const y = age.includes("-") ? age.split("-") : [age, age];
  return `(preschool OR pediatric OR child OR ages ${y[0]} to ${y[1]} OR young children)`;
};

interface Article {
  title: string;
  authors: string;
  year: string;
  journal: string;
  url: string;
  source: string;
  id: string;
  abstract?: string;
  citations?: number;
  isTrial?: boolean;
  bookmarkedAt?: number;
}

const apis: Record<string, { name: string; icon: string; color: string; search: (terms: string, age: string) => Promise<Article[]> }> = {
  pubmed: {
    name: "PubMed", icon: "🏥", color: "#2E5D8A",
    async search(terms, age) {
      const q = encodeURIComponent(`(${terms}) AND ${buildAgeTerms(age)} AND (occupational therapy OR intervention OR treatment)`);
      const r = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${q}&retmax=12&sort=relevance&retmode=json`);
      const d = await r.json(); const ids = d?.esearchresult?.idlist || [];
      if (!ids.length) return [];
      const r2 = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`);
      const d2 = await r2.json();
      return ids.map((id: string) => { const a = d2?.result?.[id]; if (!a) return null;
        return { title: a.title, authors: (a.authors||[]).map((x: {name:string})=>x.name).slice(0,4).join(", "), year: a.pubdate?.substring(0,4), journal: a.fulljournalname||a.source, url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, source: "PubMed", id };
      }).filter(Boolean) as Article[];
    },
  },
  semanticScholar: {
    name: "Semantic Scholar", icon: "🔬", color: "#1857B6",
    async search(terms, age) {
      const q = encodeURIComponent(`${terms} pediatric occupational therapy ages ${age}`);
      const r = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${q}&limit=10&fields=title,authors,year,journal,externalIds,abstract,citationCount,url`);
      const d = await r.json();
      return (d?.data||[]).map((p: any)=>({ title:p.title, authors:(p.authors||[]).map((a:any)=>a.name).slice(0,4).join(", "), year:String(p.year||""), journal:p.journal?.name||"", abstract:p.abstract, citations:p.citationCount, url:p.url||(p.externalIds?.DOI?`https://doi.org/${p.externalIds.DOI}`:""), source:"Semantic Scholar", id:p.paperId }));
    },
  },
  openAlex: {
    name: "OpenAlex", icon: "📖", color: "#C4302B",
    async search(terms, age) {
      const q = encodeURIComponent(`${terms} pediatric occupational therapy children ages ${age}`);
      const r = await fetch(`https://api.openalex.org/works?search=${q}&per_page=10&sort=relevance_score:desc&select=id,title,authorships,publication_year,primary_location,doi,cited_by_count,abstract_inverted_index`);
      const d = await r.json();
      return (d?.results||[]).map((w: any) => {
        let abs = ""; if (w.abstract_inverted_index) { const e: [number,string][] = []; for(const[word,pos] of Object.entries(w.abstract_inverted_index)) for(const p of pos as number[]) e.push([p,word]); e.sort((a,b)=>a[0]-b[0]); abs=e.map(([,w])=>w).join(" "); }
        return { title:w.title, authors:(w.authorships||[]).map((a:any)=>a.author?.display_name).filter(Boolean).slice(0,4).join(", "), year:String(w.publication_year||""), journal:w.primary_location?.source?.display_name||"", abstract:abs, citations:w.cited_by_count, url:w.doi?`https://doi.org/${w.doi.replace("https://doi.org/","")}`:"", source:"OpenAlex", id:w.id };
      });
    },
  },
  eric: {
    name: "ERIC", icon: "🎓", color: "#2D854C",
    async search(terms) {
      const q = encodeURIComponent(`${terms} occupational therapy young children`);
      const r = await fetch(`https://api.ies.ed.gov/eric/?search=${q}&rows=8&format=json`);
      const d = await r.json();
      return (d?.response?.docs||[]).map((doc: any)=>({ title:doc.title, authors:(doc.author||[]).join(", "), year:String(doc.publicationdateyear||""), journal:doc.source, abstract:doc.description, url:doc.url||`https://eric.ed.gov/?id=${doc.id}`, source:"ERIC", id:doc.id }));
    },
  },
  clinicalTrials: {
    name: "ClinicalTrials.gov", icon: "🧪", color: "#6B4C9A",
    async search(terms) {
      const q = encodeURIComponent(`${terms} occupational therapy`);
      const r = await fetch(`https://clinicaltrials.gov/api/v2/studies?query.cond=${q}&query.term=pediatric+children&pageSize=8&format=json`);
      const d = await r.json();
      return (d?.studies||[]).map((s: any) => { const p=s.protocolSection; const id=p?.identificationModule; const st=p?.statusModule; const ds=p?.designModule;
        return { title:id?.briefTitle||id?.officialTitle||"", authors:id?.organization?.fullName||"", year:st?.startDateStruct?.date?.substring(0,4)||"", journal:`Phase: ${ds?.phases?.join(", ")||"N/A"} · Status: ${st?.overallStatus||"Unknown"}`, abstract:p?.descriptionModule?.briefSummary||"", url:`https://clinicaltrials.gov/study/${id?.nctId}`, source:"ClinicalTrials.gov", id:id?.nctId, isTrial:true };
      });
    },
  },
  europepmc: {
    name: "Europe PMC", icon: "🇪🇺", color: "#006B54",
    async search(terms, age) {
      const q = encodeURIComponent(`(${terms}) AND (occupational therapy) AND (pediatric OR child OR preschool OR ages ${age})`);
      const r = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${q}&resultType=core&pageSize=10&format=json`);
      const d = await r.json();
      return (d?.resultList?.result || []).map((p: any) => ({
        title: p.title,
        authors: (p.authorList?.author || []).map((a: any) => a.fullName || `${a.firstName || ""} ${a.lastName || ""}`).slice(0, 4).join(", "),
        year: String(p.pubYear || ""),
        journal: p.journalTitle || "",
        abstract: p.abstractText || "",
        citations: p.citedByCount,
        url: p.doi ? `https://doi.org/${p.doi}` : p.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/` : "",
        source: "Europe PMC",
        id: p.id || p.pmid || p.doi,
      }));
    },
  },
  core: {
    name: "CORE", icon: "🌐", color: "#4A4A8A",
    async search(terms, age) {
      const q = encodeURIComponent(`${terms} occupational therapy pediatric children ages ${age}`);
      const r = await fetch(`https://api.core.ac.uk/v3/search/works/?q=${q}&limit=10`);
      const d = await r.json();
      return (d?.results || []).map((p: any) => ({
        title: p.title,
        authors: (p.authors || []).map((a: any) => a.name).slice(0, 4).join(", "),
        year: p.yearPublished ? String(p.yearPublished) : "",
        journal: p.publisher || "",
        abstract: p.abstract || "",
        url: p.downloadUrl || (p.doi ? `https://doi.org/${p.doi}` : ""),
        source: "CORE",
        id: p.id ? String(p.id) : p.doi,
      }));
    },
  },
  crossref: {
    name: "CrossRef", icon: "🔗", color: "#E47F2E",
    async search(terms) {
      const q = encodeURIComponent(`${terms} occupational therapy pediatric children`);
      const r = await fetch(`https://api.crossref.org/works?query=${q}&rows=8&sort=relevance&order=desc&filter=type:journal-article`);
      const d = await r.json();
      return (d?.message?.items||[]).map((item: any)=>({ title:Array.isArray(item.title)?item.title[0]:item.title||"", authors:(item.author||[]).map((a:any)=>`${a.given||""} ${a.family||""}`).slice(0,4).join(", "), year:item.published?.["date-parts"]?.[0]?.[0]?.toString()||"", journal:(item["container-title"]||[])[0]||"", citations:item["is-referenced-by-count"], url:item.DOI?`https://doi.org/${item.DOI}`:"", source:"CrossRef", id:item.DOI }));
    },
  },
};
const API_LIST = Object.keys(apis);

/* ─── PDF EXPORT ─── */
function exportSynthesisPDF(synthesis: any, meta: any, bookmarks: Article[]) {
  const now = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  const esc = (s: string) => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const strengthBadge = (s: string) => {
    const c: Record<string,string> = { strong:"#2D854C", moderate:"#B8860B", emerging:"#C4602D", limited:"#888" };
    return `<span style="background:${c[s]||"#888"}18;color:${c[s]||"#888"};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase">${esc(s)}</span>`;
  };
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>OT Evidence Synthesis</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=DM+Sans:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;color:#2C2825;max-width:800px;margin:0 auto;padding:40px 36px}
  h1{font-family:'Source Serif 4',serif;font-size:26px;font-weight:800;margin-bottom:4px}h2{font-family:'Source Serif 4',serif;font-size:18px;font-weight:700;margin:28px 0 12px;border-bottom:2px solid #E8E4DC;padding-bottom:6px}h3{font-size:15px;font-weight:700;margin:16px 0 6px}
  .meta{font-size:12px;color:#888;margin-bottom:20px}.overview{font-family:'Source Serif 4',serif;font-size:15px;line-height:1.75;border-left:3px solid #4A8C65;padding-left:16px;margin:16px 0 24px;color:#444}
  .bottom-line{background:#F0FAF4;border:1px solid #C5E8D4;border-radius:8px;padding:14px 18px;margin:16px 0}.bottom-line .label{font-size:11px;font-weight:700;color:#2D854C;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}.bottom-line p{font-size:13px;line-height:1.65;color:#2D4A3E}
  .intv{border:1px solid #E8E4DC;border-radius:10px;padding:16px 18px;margin-bottom:12px;page-break-inside:avoid}.intv-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.intv p{font-size:13px;line-height:1.65;color:#555;margin-bottom:8px}
  .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.detail-box{background:#F7F6F2;border-radius:6px;padding:8px 12px;font-size:12px}.detail-box .lbl{font-size:10px;font-weight:700;color:#AAA;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px}
  .tip{background:#4A8C6508;border-left:3px solid #4A8C65;padding:8px 14px;border-radius:0 6px 6px 0;font-size:12px;margin-top:8px}
  .gaps{background:#FFF8ED;border:1px solid #EED;border-radius:8px;padding:14px 18px;margin:16px 0}.gaps .label{font-size:11px;font-weight:700;color:#B8860B;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}.gaps p{font-size:13px;line-height:1.6;color:#665}
  .bm-item{padding:8px 0;border-bottom:1px solid #EEE;font-size:12px}.bm-item .bm-title{font-weight:600}.bm-item .bm-meta{color:#888;font-size:11px}
  .footer{margin-top:36px;font-size:10px;color:#BBB;font-style:italic;border-top:1px solid #EEE;padding-top:12px}@media print{body{padding:20px}.intv{break-inside:avoid}}
</style></head><body>
<h1>OT Evidence Synthesis</h1>
<div class="meta">${esc(meta.domain)} · Ages ${esc(meta.age)} · ${esc(meta.evLevel)} · Generated ${now}</div>
<div class="overview">${esc(synthesis.overview)}</div>
<div class="bottom-line"><div class="label">Clinical Bottom Line</div><p>${esc(synthesis.clinical_bottom_line)}</p></div>
<h2>Ranked Interventions</h2>
${(synthesis.interventions||[]).map((intv: any) => `
<div class="intv"><div class="intv-header"><h3>${esc(intv.name)}</h3>${strengthBadge(intv.strength)}</div><p>${esc(intv.description)}</p>
<div class="detail-grid">${intv.age_specific?`<div class="detail-box"><div class="lbl">Age Considerations</div>${esc(intv.age_specific)}</div>`:""} ${intv.dosage?`<div class="detail-box"><div class="lbl">Dosage</div>${esc(intv.dosage)}</div>`:""} ${intv.contraindications?`<div class="detail-box"><div class="lbl">Contraindications</div>${esc(intv.contraindications)}</div>`:""}</div>
<div class="detail-box" style="margin-bottom:8px"><div class="lbl">Evidence</div>${esc(intv.evidence_summary)}</div>
<div class="tip">${esc(intv.clinical_tips)}</div></div>`).join("")}
${synthesis.gaps?`<div class="gaps"><div class="label">Evidence Gaps</div><p>${esc(synthesis.gaps)}</p></div>`:""}
${bookmarks.length>0?`<h2>Bookmarked Articles (${bookmarks.length})</h2>${bookmarks.map(b=>`<div class="bm-item"><div class="bm-title">${esc(b.title)}</div><div class="bm-meta">${esc(b.authors)}${b.year?` · ${b.year}`:""}${b.journal?` · ${esc(b.journal)}`:""}${b.url?` · ${esc(b.url)}`:""} · ${esc(b.source)}</div></div>`).join("")}`:""}
<div class="footer">Generated by OT Evidence Finder. Always verify against current literature. Not medical advice.</div>
</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.addEventListener("load", () => setTimeout(() => win.print(), 400));
}

/* ─── MAIN COMPONENT ─── */
export default function OTEvidencePlatform() {
  const [domain, setDomain] = useState<string | null>(null);
  const [age, setAge] = useState("3-6");
  const [evLevel, setEvLevel] = useState("Any Level");
  const [query, setQuery] = useState("");
  const [sourceResults, setSourceResults] = useState<Record<string, Article[]>>({});
  const [synthesis, setSynthesis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [synthLoading, setSynthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [fetchStatus, setFetchStatus] = useState<Record<string, string>>({});
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [searchMeta, setSearchMeta] = useState<any>({});
  const [toolModal, setToolModal] = useState<{ title: string; content: string; loading: boolean } | null>(null);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const s = localStorage.getItem("ot-bookmarks"); if (s) setBookmarks(JSON.parse(s)); } catch {}
  }, []);

  const saveBookmarks = (bm: Article[]) => {
    setBookmarks(bm);
    try { localStorage.setItem("ot-bookmarks", JSON.stringify(bm)); } catch {}
  };

  const toggleBookmark = (article: Article) => {
    const exists = bookmarks.find(b => b.id === article.id);
    if (exists) saveBookmarks(bookmarks.filter(b => b.id !== article.id));
    else saveBookmarks([...bookmarks, { ...article, bookmarkedAt: Date.now() }]);
  };

  const isBookmarked = (id: string) => bookmarks.some(b => b.id === id);

  const domainObj = domain ? DOMAINS.find(d => d.id === domain) : null;
  const accent = domainObj?.color || "#4A8C65";
  const totalResults = Object.values(sourceResults).flat().length;
  const toggleCard = (id: string) => setExpandedCards(p => ({ ...p, [id]: !p[id] }));

  const getVisibleResults = (): Article[] => {
    if (activeTab === "bookmarks") return bookmarks;
    if (activeTab === "all") return Object.values(sourceResults).flat();
    return sourceResults[activeTab] || [];
  };

  const runSynthesis = useCallback(async (allResults: Article[]) => {
    setSynthLoading(true);
    const abstracts = allResults.filter(r => r.abstract).slice(0, 20).map((r, i) => `[${i+1}] "${r.title}" (${r.year}, ${r.source}): ${r.abstract?.substring(0, 500)}`).join("\n\n");
    const titles = allResults.slice(0, 30).map((r, i) => `[${i+1}] ${r.title} (${r.authors}, ${r.year}) - ${r.journal} [${r.source}]`).join("\n");
    const domainLabel = domainObj?.label || "General OT";
    const prompt = `You are an expert pediatric occupational therapy researcher. Synthesize the following research articles into actionable clinical guidance.

Domain: ${domainLabel}
Age group: ${age} years old
Evidence preference: ${evLevel}
User query: ${query || domainLabel}

ARTICLES WITH ABSTRACTS:
${abstracts || "No abstracts available."}

ALL ARTICLE TITLES:
${titles}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "overview": "3-4 sentence synthesis of what the research shows overall for this topic and age group",
  "interventions": [
    {
      "name": "Intervention name",
      "strength": "strong|moderate|emerging|limited",
      "description": "What the intervention involves (2-3 sentences)",
      "evidence_summary": "What the research says, referencing specific article numbers in brackets like [1], [3] (2-3 sentences)",
      "age_specific": "Considerations for ages ${age}",
      "dosage": "Recommended frequency/duration",
      "clinical_tips": "1-2 practical implementation strategies",
      "contraindications": "Who it may NOT be appropriate for"
    }
  ],
  "gaps": "What research is lacking or where evidence is thin (2 sentences)",
  "clinical_bottom_line": "2-3 sentence summary a busy clinician can act on immediately",
  "suggested_searches": ["3 follow-up search queries the clinician might want to explore"]
}

Provide 3-6 interventions ranked by evidence strength. Be specific and reference the articles by number.`;

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.text) {
        setSynthesis(JSON.parse(data.text.replace(/```json|```/g, "").trim()));
      }
    } catch (e) { console.error("Synthesis error", e); } finally { setSynthLoading(false); }
  }, [age, evLevel, query, domainObj]);

  const runTool = useCallback(async (title: string, prompt: string) => {
    setToolModal({ title, content: "", loading: true });
    try {
      const res = await fetch("/api/synthesize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      setToolModal({ title, content: data.text || "No output generated.", loading: false });
    } catch { setToolModal({ title, content: "Error generating output. Please try again.", loading: false }); }
  }, []);

  const exportCitations = () => {
    const apa = bookmarks.map((b, i) => {
      const authors = b.authors || "Unknown";
      const year = b.year ? `(${b.year})` : "(n.d.)";
      const title = b.title || "Untitled";
      const journal = b.journal ? `*${b.journal}*` : "";
      const url = b.url ? ` Retrieved from ${b.url}` : "";
      return `${i + 1}. ${authors} ${year}. ${title}. ${journal}${url}`;
    }).join("\n\n");
    const blob = new Blob([apa], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ot-citations-apa.txt";
    link.click();
  };

  const handleSearch = async () => {
    const terms = query.trim() || domainObj?.mesh?.join(" OR ") || "";
    if (!terms) return;
    setLoading(true); setSynthesis(null); setSourceResults({}); setFetchStatus({}); setActiveTab("all"); setExpandedCards({});
    const domainLabel = domainObj?.label || query.trim();
    setSearchMeta({ domain: domainLabel, age, evLevel, query: query.trim() });
    const allCollected: Record<string, Article[]> = {};
    await Promise.allSettled(API_LIST.map(async (key) => {
      setFetchStatus(p => ({ ...p, [key]: "loading" }));
      try {
        const results = await apis[key].search(terms, age);
        allCollected[key] = results;
        setSourceResults(p => ({ ...p, [key]: results }));
        setFetchStatus(p => ({ ...p, [key]: results.length ? "done" : "empty" }));
      } catch (e) { console.error(`${key} error:`, e); allCollected[key] = []; setFetchStatus(p => ({ ...p, [key]: "error" })); }
    }));
    setLoading(false);
    const allResults = Object.values(allCollected).flat();
    if (allResults.length > 0) runSynthesis(allResults);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  };

  const strengthColors: Record<string,string> = { strong: "#2D854C", moderate: "#B8860B", emerging: "#C4602D", limited: "#888" };

  const renderArticleCard = (r: Article, i: number) => {
    const src = apis[API_LIST.find(k => apis[k].name === r.source) || ""] || { icon: "📄", color: "#888" };
    const open = expandedCards[r.id];
    const marked = isBookmarked(r.id);
    return (
      <div key={r.id || i} className="card-hover" style={{ background: "#fff", borderRadius: 10, border: marked ? `1.5px solid ${accent}55` : "1px solid #E8E4DC", overflow: "hidden", transition: "all 0.15s" }}>
        <div style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => toggleCard(r.id)}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: "#2C2825", lineHeight: 1.4, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#888", lineHeight: 1.4 }}>
                {r.authors}{r.year ? ` · ${r.year}` : ""}{r.journal ? ` · ${r.journal}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <button onClick={(e) => { e.stopPropagation(); toggleBookmark(r); }} title={marked ? "Remove bookmark" : "Bookmark article"}
                style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: marked ? `${accent}15` : "#F5F3EE", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {marked ? "📌" : "📎"}
              </button>
              {r.citations != null && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#999", fontWeight: 600 }}>📄 {r.citations}</span>}
              <span className="src-pill" style={{ background: `${src.color}11`, color: src.color }}>{src.icon} {r.source}</span>
            </div>
          </div>
          {open && r.abstract && (
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, lineHeight: 1.65, color: "#666", margin: "10px 0 6px", borderTop: "1px solid #F0ECE4", paddingTop: 10 }}>
              {r.abstract.length > 600 ? r.abstract.substring(0, 600) + "…" : r.abstract}
            </p>
          )}
          {open && r.url && (
            <a href={r.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, display: "inline-block", marginTop: 4, color: accent }}>
              View full article →
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Source Serif 4','Georgia',serif", background: "#F6F4EF", minHeight: "100vh", color: "#2C2825" }}>
      <style>{`
        *{box-sizing:border-box}
        .card-hover:hover{box-shadow:0 4px 20px rgba(0,0,0,0.08);transform:translateY(-1px)}
        .tab-btn{transition:all .15s;cursor:pointer;border:none;background:none}
        .tab-btn:hover{background:#E8E4DC!important}
        .pulse{animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        details summary::-webkit-details-marker{display:none}
        details summary{list-style:none}
        .src-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif}
        a{color:inherit;text-decoration:none} a:hover{text-decoration:underline}
        .bm-drawer{position:fixed;top:0;right:0;width:380px;max-width:90vw;height:100vh;background:#fff;box-shadow:-8px 0 40px rgba(0,0,0,0.12);z-index:1000;overflow-y:auto}
        .bm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:999}
      `}</style>

      {/* BOOKMARKS DRAWER */}
      {showBookmarks && (<>
        <div className="bm-overlay" onClick={() => setShowBookmarks(false)} />
        <div className="bm-drawer">
          <div style={{ padding: "24px 20px", borderBottom: "1px solid #EEE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "'Source Serif 4',serif", fontSize: 20, fontWeight: 700, margin: 0 }}>📌 Bookmarks</h2>
            <button onClick={() => setShowBookmarks(false)} style={{ border: "none", background: "#F5F3EE", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {bookmarks.length === 0 && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#999", textAlign: "center", padding: 32 }}>No bookmarks yet.</p>}
            {bookmarks.map((b, i) => (
              <div key={b.id || i} style={{ padding: "12px 0", borderBottom: "1px solid #F0ECE4" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 3 }}>{b.title}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#888" }}>{b.authors}{b.year ? ` · ${b.year}` : ""} · {b.source}</div>
                    {b.url && <a href={b.url} target="_blank" rel="noreferrer" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: accent, fontWeight: 600 }}>View →</a>}
                  </div>
                  <button onClick={() => toggleBookmark(b)} style={{ border: "none", background: "#FEE", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#C44" }}>Remove</button>
                </div>
              </div>
            ))}
            {bookmarks.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <button onClick={exportCitations} style={{ fontFamily: "'DM Sans',sans-serif", width: "100%", padding: 10, border: "1px solid #DDD", borderRadius: 8, background: "#F0FAF4", cursor: "pointer", fontSize: 12, color: "#2D854C", fontWeight: 600 }}>Export APA Citations (.txt)</button>
                <button onClick={() => saveBookmarks([])} style={{ fontFamily: "'DM Sans',sans-serif", width: "100%", padding: 10, border: "1px solid #E8E4DC", borderRadius: 8, background: "#FAFAF7", cursor: "pointer", fontSize: 12, color: "#888" }}>Clear all bookmarks</button>
              </div>
            )}
          </div>
        </div>
      </>)}

      {/* TOOL MODAL */}
      {toolModal && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1001 }} onClick={() => setToolModal(null)} />
          <div style={{ position: "fixed", top: "5vh", left: "50%", transform: "translateX(-50%)", width: "min(720px,92vw)", maxHeight: "85vh", background: "#fff", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", zIndex: 1002, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #EEE", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h2 style={{ fontFamily: "'Source Serif 4',serif", fontSize: 18, fontWeight: 700, margin: 0 }}>{toolModal.title}</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {!toolModal.loading && toolModal.content && (
                  <button onClick={() => navigator.clipboard.writeText(toolModal.content)} style={{ fontFamily: "'DM Sans',sans-serif", padding: "7px 14px", borderRadius: 8, border: "1px solid #DDD", background: "#FAFAF7", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#555" }}>Copy</button>
                )}
                <button onClick={() => setToolModal(null)} style={{ border: "none", background: "#F5F3EE", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            </div>
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {toolModal.loading
                ? <div style={{ textAlign: "center", padding: 40, fontFamily: "'DM Sans',sans-serif", color: "#888" }}><span className="pulse" style={{ fontSize: 32 }}>🤖</span><p style={{ marginTop: 12 }}>Generating…</p></div>
                : <pre style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.75, color: "#333", whiteSpace: "pre-wrap", margin: 0 }}>{toolModal.content}</pre>}
            </div>
          </div>
        </>
      )}

      {/* HEADER */}
      <div style={{ background: "linear-gradient(160deg,#1E3329 0%,#162620 60%,#0F1C16 100%)", padding: "36px 24px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 400, height: "100%", background: "radial-gradient(ellipse at 80% 30%,rgba(74,140,101,0.15) 0%,transparent 70%)" }} />
        <div style={{ maxWidth: 920, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📚</div>
              <div>
                <h1 style={{ fontFamily: "'Source Serif 4',serif", fontSize: 28, fontWeight: 800, margin: 0, color: "#F0EDE4", letterSpacing: "-0.5px" }}>OT Evidence Finder</h1>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(240,237,228,0.5)", margin: 0, letterSpacing: "0.5px" }}>6 RESEARCH DATABASES · AI SYNTHESIS · PEDIATRIC AGES 3–6</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {synthesis && <button onClick={() => exportSynthesisPDF(synthesis, searchMeta, bookmarks)} style={{ fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#F0EDE4", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>📄 Export PDF</button>}
              <button onClick={() => setShowBookmarks(true)} style={{ fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#F0EDE4", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                📌 Bookmarks {bookmarks.length > 0 && <span style={{ background: "#D6603D", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{bookmarks.length}</span>}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
            {API_LIST.map(k => <span key={k} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{apis[k].icon} {apis[k].name}</span>)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 16px 80px" }}>
        {/* DOMAIN GRID */}
        <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#999", display: "block", marginBottom: 10 }}>Clinical Domain</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 8, marginBottom: 24 }}>
          {DOMAINS.map(d => {
            const sel = domain === d.id;
            return <button key={d.id} onClick={() => setDomain(sel ? null : d.id)} style={{ border: sel ? `2px solid ${d.color}` : "2px solid transparent", borderRadius: 10, padding: "14px 12px", background: sel ? `${d.color}0D` : "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s", boxShadow: sel ? `0 2px 12px ${d.color}22` : "0 1px 3px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>{d.icon}</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, fontWeight: 600, color: sel ? d.color : "#555", lineHeight: 1.3 }}>{d.label}</span>
            </button>;
          })}
        </div>

        {/* FILTERS */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#999", display: "block", marginBottom: 8 }}>Age (years)</label>
            <div style={{ display: "flex", gap: 4 }}>
              {AGES.map(a => <button key={a} onClick={() => setAge(a)} style={{ fontFamily: "'DM Sans',sans-serif", padding: "7px 13px", borderRadius: 7, border: "none", background: age === a ? accent : "#E8E4DC", color: age === a ? "#fff" : "#666", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{a}</button>)}
            </div>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#999", display: "block", marginBottom: 8 }}>Evidence Level</label>
            <select value={evLevel} onChange={e => setEvLevel(e.target.value)} style={{ fontFamily: "'DM Sans',sans-serif", width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #DDD", fontSize: 13, background: "#fff", color: "#444" }}>
              {EV_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* SEARCH */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="e.g. 'sensory integration for classroom participation'"
            style={{ fontFamily: "'DM Sans',sans-serif", flex: 1, padding: "14px 18px", borderRadius: 12, border: "1.5px solid #DDD", fontSize: 14, background: "#fff", outline: "none" }} />
          <button onClick={handleSearch} disabled={loading || (!domain && !query.trim())}
            style={{ fontFamily: "'DM Sans',sans-serif", padding: "14px 32px", borderRadius: 12, border: "none", background: loading ? "#AAA" : accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap" }}>
            {loading ? "Searching…" : "Search All Sources"}
          </button>
        </div>

        {/* FETCH STATUS */}
        {Object.keys(fetchStatus).length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {API_LIST.map(k => {
              const st = fetchStatus[k]; if (!st) return null; const c = apis[k];
              const sc = st === "done" ? "#2D854C" : st === "error" ? "#C44" : st === "empty" ? "#B8860B" : "#888";
              const tx = st === "loading" ? "…" : st === "done" ? `${sourceResults[k]?.length||0}` : st === "error" ? "✗" : "0";
              return <div key={k} className="src-pill" style={{ background: `${c.color}11`, color: c.color, border: `1px solid ${c.color}22` }}>{c.icon} {c.name} <span style={{ background: sc, color: "#fff", borderRadius: 8, padding: "0 6px", fontSize: 10, minWidth: 18, textAlign: "center" }}>{st === "loading" ? <span className="pulse">…</span> : tx}</span></div>;
            })}
          </div>
        )}

        <div ref={resultsRef} />

        {/* SYNTHESIS */}
        {(synthLoading || synthesis) && (
          <div style={{ background: "#fff", border: `2px solid ${accent}22`, borderRadius: 16, padding: "24px 28px", marginBottom: 28, boxShadow: `0 4px 24px ${accent}08` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Evidence Synthesis</h2>
                {synthLoading && <span className="pulse" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#888" }}>Analyzing {totalResults} articles…</span>}
              </div>
              {synthesis && <button onClick={() => exportSynthesisPDF(synthesis, searchMeta, bookmarks)} style={{ fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}33`, background: `${accent}08`, color: accent, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>📄 Export PDF</button>}
            </div>
            {synthesis && (<>
              <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "#444", margin: "0 0 20px", borderLeft: `3px solid ${accent}`, paddingLeft: 16 }}>{synthesis.overview}</p>
              <div style={{ background: "#F0FAF4", border: "1px solid #C5E8D4", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#2D854C", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>⚡ Clinical Bottom Line</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#2D4A3E" }}>{synthesis.clinical_bottom_line}</p>
              </div>
              <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#999", margin: "24px 0 12px" }}>Ranked Interventions</h3>
              {synthesis.interventions?.map((intv: any, i: number) => (
                <details key={i} open={i < 2} style={{ background: "#FAFAF7", border: "1px solid #E8E4DC", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
                  <summary style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14 }}>{intv.name}</span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "3px 10px", borderRadius: 20, background: `${strengthColors[intv.strength]||"#888"}18`, color: strengthColors[intv.strength]||"#888" }}>{intv.strength}</span>
                  </summary>
                  <div style={{ padding: "4px 18px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.7, color: "#555" }}>
                    <p style={{ marginTop: 0 }}>{intv.description}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      {([["AGE CONSIDERATIONS",intv.age_specific],["DOSAGE",intv.dosage],["CONTRAINDICATIONS",intv.contraindications]] as [string,string][]).map(([label,val]) => val ? <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #EEE" }}><div style={{ fontSize: 10, fontWeight: 700, color: "#AAA", marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>{val}</div> : null)}
                    </div>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #EEE", marginBottom: 8 }}><div style={{ fontSize: 10, fontWeight: 700, color: "#AAA", marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 }}>EVIDENCE</div>{intv.evidence_summary}</div>
                    <div style={{ background: `${accent}08`, borderLeft: `3px solid ${accent}`, padding: "8px 14px", borderRadius: "0 8px 8px 0", fontSize: 13 }}>💡 {intv.clinical_tips}</div>
                  </div>
                </details>
              ))}
              {synthesis.gaps && <div style={{ background: "#FFF8ED", border: "1px solid #EED", borderRadius: 10, padding: "14px 18px", marginTop: 16, marginBottom: 16 }}><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#B8860B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>🔍 Evidence Gaps</div><p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#665" }}>{synthesis.gaps}</p></div>}
              {synthesis.suggested_searches?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#AAA", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Suggested Follow-up Searches</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {synthesis.suggested_searches.map((s: string, i: number) => <button key={i} onClick={() => setQuery(s)} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, padding: "6px 14px", borderRadius: 8, border: `1px solid ${accent}33`, background: `${accent}08`, color: accent, cursor: "pointer", fontWeight: 500 }}>{s}</button>)}
                  </div>
                </div>
              )}
            </>)}
          </div>
        )}

        {/* CLINICAL TOOLS */}
        {synthesis && (() => {
          const domainLabel = domainObj?.label || query.trim() || "General OT";
          const topInterventions = (synthesis.interventions || []).slice(0, 3).map((i: any) => `${i.name}: ${i.clinical_tips}`).join("; ");
          const interventionNames = (synthesis.interventions || []).map((i: any) => i.name).join(", ");
          const tools = [
            { icon: "🎯", label: "Goal Bank", desc: "SMART goals in IEP-ready language", fn: () => runTool("Goal Bank", `You are an expert pediatric occupational therapist. Generate 6-8 SMART goals for:\nDomain: ${domainLabel}\nAge: ${age} years\nInterventions: ${interventionNames}\n\nFor each goal provide:\n- A short-term goal (4-8 weeks)\n- A long-term goal (6 months)\n\nUse IEP-compatible language. Be specific, measurable, and functional. Include the condition, behavior, and criterion. Format clearly with numbered goals.`) },
            { icon: "📋", label: "Parent Handout", desc: "Plain-language take-home activities", fn: () => runTool("Parent/Caregiver Handout", `Create a warm, friendly parent handout for home practice. Write at a 6th-grade reading level. Avoid jargon.\n\nChild context:\nDomain: ${domainLabel}\nAge: ${age} years\nTop strategies: ${topInterventions}\n\nInclude:\n1. What we are working on (1 short paragraph)\n2. Why it matters for your child (1 short paragraph)\n3. 4-5 activities to try at home — with step-by-step instructions\n4. What progress looks like\n5. When to reach out to your OT\n\nTone: warm, encouraging, practical.`) },
            { icon: "📏", label: "Outcome Measures", desc: "Validated assessment tool recommendations", fn: () => runTool("Outcome Measure Recommendations", `You are a pediatric OT assessment expert. Recommend validated outcome measures for:\nDomain: ${domainLabel}\nAge: ${age} years\n\nFor each tool list:\n- Full name and abbreviation\n- What it measures\n- Age range\n- Administration time\n- Why appropriate for this domain\n- Free or requires purchase\n\nInclude 6-8 tools. Prioritize tools commonly accepted by insurance and school systems.`) },
            { icon: "💳", label: "CPT Codes", desc: "Billing codes & medical necessity language", fn: () => runTool("CPT Codes & Documentation", `You are a pediatric OT billing and documentation expert. Provide CPT codes and documentation language for:\nDomain: ${domainLabel}\nAge: ${age} years\nInterventions: ${interventionNames}\n\nProvide:\n1. Primary CPT codes with full descriptions\n2. Secondary/supporting codes\n3. Medical necessity statement template\n4. Functional limitation language for insurance\n5. Common denial reasons and how to address them\n\nNote: Clinician should verify against current payer contracts.`) },
            { icon: "📝", label: "Progress Note", desc: "SOAP note template pre-filled for this domain", fn: () => runTool("SOAP Note Template", `Generate a SOAP note template for a pediatric OT session:\nDomain: ${domainLabel}\nAge: ${age} years\nPrimary intervention: ${(synthesis.interventions || [])[0]?.name || domainLabel}\n\nS (Subjective): Include caregiver report prompts in [brackets]\nO (Objective): Observable behaviors and measurable data fields in [brackets]\nA (Assessment): Template language linking observations to goals, with [blanks]\nP (Plan): Next session plan template\n\nMake it insurance-ready and practical. Use [FILL IN] for clinician-specific data.`) },
            { icon: "👨‍👩‍👧", label: "Family Mode", desc: "Rewrite synthesis in plain language", fn: () => runTool("Family-Friendly Summary", `Rewrite this OT evidence synthesis as a warm, plain-language explanation for a parent or caregiver. 6th-grade reading level. No jargon.\n\nOverview: ${synthesis.overview}\nBottom line: ${synthesis.clinical_bottom_line}\nKey approaches: ${(synthesis.interventions || []).slice(0, 3).map((i: any) => `${i.name}: ${i.description} Practical tip: ${i.clinical_tips}`).join("\n")}\n\nFocus on: what this means for their child, what to expect, and how they can help at home. Be encouraging and specific.`) },
          ];
          return (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#999", marginBottom: 10 }}>Clinical Tools</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
                {tools.map(t => (
                  <button key={t.label} onClick={t.fn} style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 20 }}>{t.icon}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: "#2C2825" }}>{t.label}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#999", lineHeight: 1.4 }}>{t.desc}</div>
                  </button>
                ))}
              </div>

              {/* INTERVENTION COMPARISON */}
              {(synthesis.interventions || []).length >= 2 && (
                <div style={{ marginTop: 12, background: "#fff", border: "1px solid #E8E4DC", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: "#2C2825", marginBottom: 10 }}>⚖️ Compare Interventions</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <select value={compareA} onChange={e => setCompareA(Number(e.target.value))} style={{ fontFamily: "'DM Sans',sans-serif", padding: "7px 12px", borderRadius: 8, border: "1.5px solid #DDD", fontSize: 13, flex: 1, minWidth: 140 }}>
                      {(synthesis.interventions || []).map((intv: any, i: number) => <option key={i} value={i}>{intv.name}</option>)}
                    </select>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", color: "#AAA", fontWeight: 700 }}>vs</span>
                    <select value={compareB} onChange={e => setCompareB(Number(e.target.value))} style={{ fontFamily: "'DM Sans',sans-serif", padding: "7px 12px", borderRadius: 8, border: "1.5px solid #DDD", fontSize: 13, flex: 1, minWidth: 140 }}>
                      {(synthesis.interventions || []).map((intv: any, i: number) => <option key={i} value={i}>{intv.name}</option>)}
                    </select>
                    <button onClick={() => {
                      const a = synthesis.interventions[compareA];
                      const b = synthesis.interventions[compareB];
                      runTool(`${a.name} vs ${b.name}`, `Compare these two OT interventions for a ${age}-year-old with ${domainLabel}:\n\nIntervention A: ${a.name}\nStrength: ${a.strength}\nDescription: ${a.description}\nDosage: ${a.dosage}\nContraindications: ${a.contraindications}\nEvidence: ${a.evidence_summary}\n\nIntervention B: ${b.name}\nStrength: ${b.strength}\nDescription: ${b.description}\nDosage: ${b.dosage}\nContraindications: ${b.contraindications}\nEvidence: ${b.evidence_summary}\n\nCompare on: evidence strength, best candidate profile, implementation differences, time/resource requirements, expected outcomes, and when to choose each. Format with clear headers.`);
                    }} style={{ fontFamily: "'DM Sans',sans-serif", padding: "8px 18px", borderRadius: 8, border: "none", background: accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Compare</button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TABS + ARTICLES */}
        {(totalResults > 0 || bookmarks.length > 0) && (<>
          <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #E8E4DC", marginBottom: 16, overflowX: "auto" }}>
            {totalResults > 0 && <button className="tab-btn" onClick={() => setActiveTab("all")} style={{ fontFamily: "'DM Sans',sans-serif", padding: "10px 16px", fontSize: 12, fontWeight: 700, color: activeTab === "all" ? accent : "#888", borderBottom: activeTab === "all" ? `2px solid ${accent}` : "2px solid transparent", marginBottom: -2, borderRadius: "6px 6px 0 0" }}>All ({totalResults})</button>}
            {API_LIST.map(k => { const c = sourceResults[k]?.length || 0; if (!c) return null;
              return <button key={k} className="tab-btn" onClick={() => setActiveTab(k)} style={{ fontFamily: "'DM Sans',sans-serif", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: activeTab === k ? apis[k].color : "#888", borderBottom: activeTab === k ? `2px solid ${apis[k].color}` : "2px solid transparent", marginBottom: -2, borderRadius: "6px 6px 0 0" }}>{apis[k].icon} {apis[k].name} ({c})</button>;
            })}
            <button className="tab-btn" onClick={() => setActiveTab("bookmarks")} style={{ fontFamily: "'DM Sans',sans-serif", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: activeTab === "bookmarks" ? "#D6603D" : "#888", borderBottom: activeTab === "bookmarks" ? "2px solid #D6603D" : "2px solid transparent", marginBottom: -2, borderRadius: "6px 6px 0 0", marginLeft: "auto" }}>📌 ({bookmarks.length})</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {getVisibleResults().length === 0 && activeTab === "bookmarks" && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#999", textAlign: "center", padding: 32 }}>No bookmarked articles yet.</p>}
            {getVisibleResults().map((r, i) => renderArticleCard(r, i))}
          </div>
        </>)}

        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#BBB", marginTop: 36, fontStyle: "italic", lineHeight: 1.6 }}>
          Aggregates PubMed, Semantic Scholar, OpenAlex, ERIC, ClinicalTrials.gov & CrossRef. AI synthesis supports clinical reasoning — verify against current literature. Not medical advice.
        </p>
      </div>
    </div>
  );
}
