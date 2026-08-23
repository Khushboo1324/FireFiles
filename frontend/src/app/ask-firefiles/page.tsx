import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = { title: "Ask FireFiles | FireFiles" };

export default function AskFireFilesRoute() {
  return (
    <FeaturePlaceholder
      activeRoute="ask-firefiles"
      description="AI questions and generated responses are outside the scope of this assignment."
      icon="smart-toy"
      title="Ask FireFiles"
    />
  );
}
