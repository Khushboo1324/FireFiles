import { ActionItemsSection } from "@/components/meeting-detail/action-items-section";
import { ChaptersSection } from "@/components/meeting-detail/chapters-section";
import { MeetingSummary } from "@/components/meeting-detail/meeting-summary";
import { ParticipantAvatar } from "@/components/meeting-detail/participant-avatar";
import { Icon } from "@/components/ui/icon";
import type { ActionItem, MeetingDetail } from "@/lib/api/types";
import {
  formatDuration,
  formatMeetingDate,
  formatMeetingTime,
} from "@/lib/formatters/meeting";

export function MeetingNotes({
  actionItemsHighlighted,
  meeting,
  onActionItemsChange,
  onNotify,
}: {
  actionItemsHighlighted: boolean;
  meeting: MeetingDetail;
  onActionItemsChange: (update: (items: ActionItem[]) => ActionItem[]) => void;
  onNotify: (message: string, tone: "success" | "error") => void;
}) {
  return (
    <section className="meeting-notes-panel relative flex min-h-0 min-w-0 flex-col bg-white">
      <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 rounded-lg bg-[#f2f3f6] p-1">
        <button
          aria-selected="true"
          className="rounded-md bg-white px-5 py-1.5 text-[12px] font-semibold text-[#3a4356] shadow-[0_1px_3px_rgba(20,23,31,0.08)]"
          role="tab"
          type="button"
        >
          Notes
        </button>
        <button
          aria-selected="false"
          className="px-4 py-1.5 text-[12px] font-medium text-[#7f899b] disabled:opacity-100"
          disabled
          role="tab"
          title="AI Skills — available in an upcoming step"
          type="button"
        >
          AI Skills · 0
        </button>
      </div>

      <button
        aria-label="Expand notes"
        className="absolute right-4 top-4 flex size-7 items-center justify-center rounded text-ff-muted disabled:opacity-100"
        disabled
        title="Expand — available in an upcoming step"
        type="button"
      >
        <Icon name="expand" size={17} />
      </button>

      <div className="meeting-notes-scroll min-h-0 flex-1 overflow-y-auto px-8 pb-10 pt-24 min-[1500px]:px-14">
        <div className="mx-auto max-w-[720px]">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-semibold tracking-[-0.02em] text-[#202738]">
                {meeting.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[#69758b]">
                {meeting.participants.length > 0 && (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="flex -space-x-1">
                      {meeting.participants.slice(0, 3).map((participant) => (
                        <ParticipantAvatar
                          key={participant.id}
                          participant={participant}
                          size="small"
                        />
                      ))}
                    </span>
                    <span className="max-w-[210px] truncate">
                      {meeting.participants
                        .map((participant) => participant.name)
                        .join(", ")}
                    </span>
                  </span>
                )}
                <time dateTime={meeting.meeting_date}>
                  {formatMeetingDate(meeting.meeting_date)}, {formatMeetingTime(meeting.meeting_date)}
                </time>
                <span>{formatDuration(meeting.duration_seconds)}</span>
              </div>
            </div>
            <button
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-ff-border px-3 text-[11px] text-ff-muted disabled:opacity-100"
              disabled
              title="Video playback — available in an upcoming step"
              type="button"
            >
              <Icon name="video-camera" size={15} />
              Video
            </button>
          </div>

          <div className="mb-8 flex items-center gap-2 border-b border-ff-border pb-3 text-[#6d38da]">
            <button
              className="flex h-8 items-center gap-1.5 rounded px-2 text-[12px] font-medium disabled:opacity-100"
              disabled
              title="Summary style — available in an upcoming step"
              type="button"
            >
              <Icon name="sparkles" size={16} />
              General Summary
              <Icon name="chevron-down" size={13} />
            </button>
            <button
              className="flex h-8 items-center gap-1.5 rounded px-2 text-[12px] font-medium disabled:opacity-100 max-[1280px]:hidden"
              disabled
              title="Refine Summary — available in an upcoming step"
              type="button"
            >
              <Icon name="wand" size={16} />
              Refine Summary
            </button>
            <button
              aria-label="Copy summary"
              className="ml-auto flex size-8 items-center justify-center rounded text-ff-muted disabled:opacity-100"
              disabled
              title="Copy summary — available in an upcoming step"
              type="button"
            >
              <Icon name="copy" size={16} />
            </button>
          </div>

          <div className="space-y-9">
            <MeetingSummary summary={meeting.summary} />
            <ActionItemsSection
              durationSeconds={meeting.duration_seconds}
              highlighted={actionItemsHighlighted}
              items={meeting.action_items}
              key={meeting.id}
              meetingId={meeting.id}
              onItemsChange={onActionItemsChange}
              onNotify={onNotify}
              participants={meeting.participants}
            />
            <ChaptersSection chapters={meeting.chapters} />
          </div>
        </div>
      </div>
    </section>
  );
}
