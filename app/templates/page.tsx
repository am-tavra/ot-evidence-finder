import { FileText } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";
export const metadata = { title: "Templates — Seedling" };
export default function TemplatesPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Templates"
      phase="PHASE 2 · COMING SOON"
      description="Save, edit, and reuse the clinical documents Seedling generates for you. Build a personal library of goals, SOAP notes, and handouts tailored to your practice style."
      features={[
        "Save generated goal banks and edit them to your voice",
        "Build a personal SOAP note template library by domain",
        "Practice-wide shared templates set by your supervisor or admin",
        "Version history so you can see how your templates evolve",
        "One-click insert into a case or export to PDF",
      ]}
    />
  );
}
