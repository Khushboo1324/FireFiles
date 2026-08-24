import type { MeetingListItem } from "@/lib/api/types";

const groupDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const meetingDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const meetingTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function localDayKey(value: Date): string {
  return [value.getFullYear(), value.getMonth() + 1, value.getDate()].join("-");
}

export function formatDuration(durationSeconds: number): string {
  const totalMinutes = Math.max(0, Math.round(durationSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes} min`;
  }

  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

export function formatTimestamp(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Meeting timestamps stay compact until the duration crosses one hour.
  if (hours === 0) {
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatMeetingDate(value: string): string {
  return meetingDateFormatter.format(new Date(value));
}

export function formatMeetingTime(value: string): string {
  return meetingTimeFormatter.format(new Date(value));
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0][0];
  const last = parts.length > 1 ? parts.at(-1)?.[0] : "";
  return `${first}${last}`.toUpperCase();
}

export function formatParticipantNames(
  names: string[],
  visibleCount = 2,
): string {
  const visibleNames = names.slice(0, visibleCount);
  const remainingCount = Math.max(0, names.length - visibleNames.length);

  return `${visibleNames.join(", ")}${remainingCount > 0 ? ` +${remainingCount}` : ""}`;
}

export function formatMeetingGroupLabel(value: Date, now = new Date()): string {
  const day = startOfLocalDay(value);
  const today = startOfLocalDay(now);
  const differenceInDays = Math.round(
    (today.getTime() - day.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (differenceInDays === 0) {
    return "Today";
  }
  if (differenceInDays === 1) {
    return "Yesterday";
  }
  return groupDateFormatter.format(value);
}

export interface MeetingDateGroup {
  key: string;
  label: string;
  meetings: MeetingListItem[];
}

export function groupMeetingsByLocalDate(
  meetings: MeetingListItem[],
): MeetingDateGroup[] {
  const groups = new Map<string, MeetingDateGroup>();

  // API datetimes are grouped after browser-local conversion so headings match row times.
  for (const meeting of meetings) {
    const meetingDate = new Date(meeting.meeting_date);
    const key = localDayKey(meetingDate);
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.meetings.push(meeting);
      continue;
    }

    groups.set(key, {
      key,
      label: formatMeetingGroupLabel(meetingDate),
      meetings: [meeting],
    });
  }

  return Array.from(groups.values());
}
