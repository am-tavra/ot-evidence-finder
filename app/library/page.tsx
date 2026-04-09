import { BookOpen } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";
export const metadata = { title: "Library — Seedling" };
export default function LibraryPage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Library"
      phase="PHASE 2 · COMING SOON"
      description="Your personal and practice-wide collection of saved research. Articles you bookmark, syntheses you generate, and protocols your team builds — all in one place."
      features={[
        "Personal bookmarks synced across devices",
        "Practice library shared across your whole team",
        "Saved syntheses you can return to without re-searching",
        "Annotate and tag articles for quick retrieval",
        "Export reading lists as APA citations",
      ]}
    />
  );
}
