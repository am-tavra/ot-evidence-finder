import { FolderOpen } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";
export const metadata = { title: "My Cases — Seedling" };
export default function CasesPage() {
  return (
    <ComingSoon
      icon={FolderOpen}
      title="My Cases"
      phase="PHASE 2 · COMING SOON"
      description="Organise your research by patient or child. Keep every search, synthesis, goal, and handout tied to the case it was created for."
      features={[
        "Create a folder for each patient or caseload group",
        "All searches, syntheses, and saved tools link to a case",
        "Export a full evidence package per case for supervision or IEP meetings",
        "Transfer cases when a patient moves between clinicians",
        "Search history and session notes per case",
      ]}
    />
  );
}
