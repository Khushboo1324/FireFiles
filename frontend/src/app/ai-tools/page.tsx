import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = { title: "AI Tools | FireFiles" };

export default function AiToolsRoute() {
  return (
    <FeaturePlaceholder
      activeRoute="ai-tools"
      description="Additional AI tools and skills are not included in this demo."
      icon="auto-awesome"
      title="AI Tools"
    />
  );
}
