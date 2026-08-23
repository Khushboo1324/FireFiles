import type { Metadata } from "next";

import { MeetingDetailPage } from "@/components/meeting-detail/meeting-detail-page";

export const metadata: Metadata = {
  title: "Meeting | FireFiles",
};

export default async function MeetingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = /^\d+$/.test(id) ? Number(id) : Number.NaN;
  const meetingId =
    Number.isSafeInteger(numericId) && numericId > 0 ? numericId : null;

  return <MeetingDetailPage meetingId={meetingId} />;
}
