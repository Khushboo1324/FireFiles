import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = { title: "Meeting Status | FireFiles" };

export default function MeetingStatusRoute() {
  return (
    <FeaturePlaceholder
      activeRoute="meeting-status"
      description="Live capture status and meeting-bot monitoring are not included in this demo."
      icon="equalizer"
      title="Meeting Status"
    />
  );
}
