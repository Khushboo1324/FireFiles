import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = { title: "Integrations | FireFiles" };

export default function IntegrationsRoute() {
  return (
    <FeaturePlaceholder
      activeRoute="integrations"
      description="Integration connections are outside the scope of this assignment."
      icon="extension"
      title="Integrations"
    />
  );
}
