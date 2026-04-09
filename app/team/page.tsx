import { Users } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";
export const metadata = { title: "Team — Seedling" };
export default function TeamPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Team"
      phase="PHASE 3 · COMING SOON"
      description="Bring your whole practice onto Seedling. Shared protocols, supervisory workflows, and visibility into what your team is researching — built for how OT practices actually work."
      features={[
        "Invite clinicians, supervisors, and student interns",
        "Role-based access: admin, clinician, student (read-only)",
        "Supervisor review queue for goals and documentation",
        "Shared practice protocol library built from team syntheses",
        "Practice-level insights: top domains, most-searched conditions",
      ]}
    />
  );
}
