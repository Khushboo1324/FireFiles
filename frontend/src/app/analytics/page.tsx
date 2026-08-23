import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = { title: "Analytics | FireFiles" };

export default function AnalyticsRoute() {
  return (
    <FeaturePlaceholder
      activeRoute="analytics"
      description="Advanced team analytics are outside the scope of this assignment."
      icon="bar-chart"
      title="Analytics"
    />
  );
}
