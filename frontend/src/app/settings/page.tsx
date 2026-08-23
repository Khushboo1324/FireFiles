import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = { title: "Settings | FireFiles" };

const sections = [
  {
    title: "Profile",
    description: "Demo User. Authentication and profile editing are unavailable.",
  },
  {
    title: "Notifications",
    description: "Notification preferences are not included in this assignment.",
  },
  {
    title: "Integrations",
    description: "External account connections are not enabled in this demo.",
  },
];

export default function SettingsRoute() {
  return (
    <FeaturePlaceholder
      activeRoute="settings"
      description="This demo uses a local placeholder account. Account preferences are intentionally unavailable."
      icon="settings"
      sections={sections}
      title="Settings"
    />
  );
}
