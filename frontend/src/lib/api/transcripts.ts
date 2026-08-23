import { apiFetch } from "@/lib/api/client";
import type { MeetingDetail } from "@/lib/api/types";

function assertMeetingId(meetingId: number): void {
  if (!Number.isSafeInteger(meetingId) || meetingId <= 0) {
    throw new RangeError("Meeting id must be a positive integer.");
  }
}

export function uploadTranscript(
  meetingId: number,
  file: File,
  replaceExisting = false,
): Promise<MeetingDetail> {
  assertMeetingId(meetingId);

  const body = new FormData();
  body.append("file", file);
  if (replaceExisting) {
    body.append("replace_existing", "true");
  }

  // The browser owns the multipart boundary, so this request intentionally has
  // no explicit Content-Type header.
  return apiFetch<MeetingDetail>(
    `/api/meetings/${meetingId}/transcript/upload`,
    { method: "POST", body },
  );
}

export function pasteTranscript(
  meetingId: number,
  content: string,
  replaceExisting = false,
): Promise<MeetingDetail> {
  assertMeetingId(meetingId);

  return apiFetch<MeetingDetail>(
    `/api/meetings/${meetingId}/transcript/paste`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        replace_existing: replaceExisting,
      }),
    },
  );
}
