import Link from "next/link";

import { MeetingActionsMenu } from "@/components/meetings/meeting-actions-menu";
import { Icon } from "@/components/ui/icon";
import type { MeetingListItem } from "@/lib/api/types";
import {
  formatDuration,
  formatMeetingDate,
  formatMeetingTime,
  getInitials,
} from "@/lib/formatters/meeting";

const tileStyles = [
  "bg-[#ece8ff] text-[#5b36b2]",
  "bg-[#e6f0f5] text-[#34657c]",
  "bg-[#f5e9e6] text-[#8a5145]",
  "bg-[#e8f1eb] text-[#3f7252]",
  "bg-[#f1ebdf] text-[#76613e]",
];

export function MeetingRow({
  meeting,
  onDelete,
  onEdit,
}: {
  meeting: MeetingListItem;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const participantNames = meeting.participants
    .map((participant) => participant.name)
    .join(", ");
  const meetingInitial = meeting.title.trim().charAt(0).toUpperCase() || "M";
  const tileStyle = tileStyles[meeting.id % tileStyles.length];

  return (
    <article className="group relative flex min-h-16 items-center rounded-lg border border-ff-border bg-white transition-colors hover:bg-ff-subtle focus-within:bg-ff-subtle">
      <span className="absolute inset-y-0 left-0 hidden w-[3px] bg-ff-primary group-hover:block group-focus-within:block" />
      <Link
        aria-label={`Open ${meeting.title}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 focus-visible:outline-none"
        href={`/meetings/${meeting.id}`}
      >
        <span
          aria-hidden="true"
          className={`flex size-10 shrink-0 items-center justify-center rounded-md text-[14px] font-semibold ${tileStyle}`}
        >
          {meetingInitial}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-ff-text">
              {meeting.title}
            </span>
            <Icon
              className="shrink-0 text-ff-muted"
              name="chevron-right"
              size={14}
            />
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-[11px] leading-4 text-ff-muted">
            <time dateTime={meeting.meeting_date}>
              {formatMeetingDate(meeting.meeting_date)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{formatMeetingTime(meeting.meeting_date)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDuration(meeting.duration_seconds)}</span>
            {participantNames && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{participantNames}</span>
              </>
            )}
          </span>
        </span>

        {meeting.participants.length > 0 && (
          <span
            aria-label={`${meeting.participants.length} participants`}
            className="hidden shrink-0 items-center -space-x-1.5 min-[1080px]:flex"
            role="img"
          >
            {meeting.participants.slice(0, 3).map((participant) => (
              <span
                className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-ff-border-soft text-[8px] font-semibold text-ff-muted"
                key={participant.id}
                title={participant.name}
              >
                {getInitials(participant.name)}
              </span>
            ))}
            {meeting.participants.length > 3 && (
              <span className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-ff-muted-surface text-[8px] font-semibold text-ff-muted">
                +{meeting.participants.length - 3}
              </span>
            )}
          </span>
        )}
      </Link>

      <div className="mr-2">
        <MeetingActionsMenu
          meetingTitle={meeting.title}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </article>
  );
}
