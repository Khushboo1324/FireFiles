import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = { title: "Team | FireFiles" };

export default function TeamRoute() {
  return (
    <FeaturePlaceholder
      activeRoute="team"
      description="Team administration and shared workspaces are outside the scope of this assignment."
      icon="users"
      title="Team"
    />
  );
}
