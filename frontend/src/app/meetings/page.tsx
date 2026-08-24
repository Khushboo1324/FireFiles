import type { Metadata } from "next";

import { MeetingsPage } from "@/components/meetings/meetings-page";

export const metadata: Metadata = {
  title: "Meetings | FireFiles",
};

export default async function MeetingsRoute({
  searchParams,
}: PageProps<"/meetings">) {
  const { create } = await searchParams;

  return <MeetingsPage openCreateDialog={create === "1"} />;
}
