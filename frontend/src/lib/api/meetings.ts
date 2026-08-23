import { apiFetch } from "@/lib/api/client";
import type {
  ISODateString,
  MeetingCreateRequest,
  MeetingDetail,
  MeetingListResponse,
} from "@/lib/api/types";

export type MeetingSort = "newest" | "oldest";

export interface ListMeetingsOptions {
  search?: string;
  participant?: string;
  dateFrom?: ISODateString;
  dateTo?: ISODateString;
  sort?: MeetingSort;
  limit?: number;
  offset?: number;
}

function appendNonBlank(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void {
  const normalizedValue = value?.trim();
  if (normalizedValue) {
    params.set(key, normalizedValue);
  }
}

export function listMeetings(
  options: ListMeetingsOptions = {},
): Promise<MeetingListResponse> {
  const params = new URLSearchParams();
  appendNonBlank(params, "search", options.search);
  appendNonBlank(params, "participant", options.participant);
  appendNonBlank(params, "date_from", options.dateFrom);
  appendNonBlank(params, "date_to", options.dateTo);

  if (options.sort !== undefined) {
    params.set("sort", options.sort);
  }
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.offset !== undefined) {
    params.set("offset", String(options.offset));
  }

  const query = params.toString();
  return apiFetch<MeetingListResponse>(
    `/api/meetings${query ? `?${query}` : ""}`,
  );
}

export function getMeeting(meetingId: number): Promise<MeetingDetail> {
  if (!Number.isSafeInteger(meetingId) || meetingId <= 0) {
    throw new RangeError("Meeting id must be a positive integer.");
  }

  return apiFetch<MeetingDetail>(`/api/meetings/${meetingId}`);
}

export function createMeeting(
  request: MeetingCreateRequest,
): Promise<MeetingDetail> {
  return apiFetch<MeetingDetail>("/api/meetings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}
