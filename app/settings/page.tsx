import { Settings } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";
export const metadata = { title: "Settings — Seedling" };
export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      phase="PHASE 2 · COMING SOON"
      description="Manage your account, preferences, and practice configuration. Everything in one place once authentication is live."
      features={[
        "Profile and credentials",
        "Notification preferences",
        "Default age range and evidence level preferences",
        "Billing and subscription management",
        "Data export and account deletion",
      ]}
    />
  );
}
