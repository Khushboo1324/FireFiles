import type { Metadata } from "next";

import { MeetingsPage } from "@/components/meetings/meetings-page";

export const metadata: Metadata = {
  title: "Meetings | FireFiles",
};

export default function MeetingsRoute() {
  return <MeetingsPage />;
}
