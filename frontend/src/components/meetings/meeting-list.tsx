import { MeetingRow } from "@/components/meetings/meeting-row";
import type { MeetingListItem } from "@/lib/api/types";
import { groupMeetingsByLocalDate } from "@/lib/formatters/meeting";

interface MeetingListProps {
  meetings: MeetingListItem[];
  isLoading: boolean;
  hasError: boolean;
  hasActiveQuery: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onNewMeeting: () => void;
  onDeleteMeeting: (meeting: MeetingListItem) => void;
  onEditMeeting: (meeting: MeetingListItem) => void;
}

function MeetingListSkeleton() {
  return (
    <div
      aria-label="Loading meetings"
      className="space-y-2"
      role="status"
    >
      <div className="mb-3 h-2.5 w-16 rounded bg-ff-border-soft" />
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="flex min-h-16 animate-pulse items-center gap-3 rounded-lg border border-ff-border bg-white px-3 motion-reduce:animate-none"
          key={index}
        >
          <div className="size-10 shrink-0 rounded-md bg-ff-border-soft" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-2/5 rounded bg-ff-border-soft" />
            <div className="h-2 w-3/5 rounded bg-ff-muted-surface" />
          </div>
          <div className="size-6 rounded-full bg-ff-muted-surface" />
        </div>
      ))}
    </div>
  );
}

function ListMessage({
  children,
  actionLabel,
  onAction,
  primaryAction = false,
  role,
}: {
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  primaryAction?: boolean;
  role?: "alert";
}) {
  return (
    <div
      className="mx-auto mt-20 max-w-sm rounded-lg border border-ff-border bg-ff-subtle px-5 py-7 text-center"
      role={role}
    >
      <p className="text-[13px] font-medium text-ff-text">{children}</p>
      {actionLabel && onAction && (
        <button
          className={`mt-3 h-8 rounded-md px-3 text-[11px] font-semibold transition-colors ${
            primaryAction
              ? "bg-ff-primary text-white hover:bg-ff-primary-hover"
              : "border border-ff-border bg-white text-ff-text hover:bg-ff-muted-surface"
          }`}
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function MeetingList({
  meetings,
  isLoading,
  hasError,
  hasActiveQuery,
  onRetry,
  onClearFilters,
  onNewMeeting,
  onDeleteMeeting,
  onEditMeeting,
}: MeetingListProps) {
  const groups = groupMeetingsByLocalDate(meetings);

  return (
    <section
      aria-busy={isLoading}
      aria-label="Meetings library"
      className="min-h-0 flex-1 overflow-y-auto bg-white p-5"
    >
      {isLoading && <MeetingListSkeleton />}

      {!isLoading && hasError && (
        <ListMessage actionLabel="Retry" onAction={onRetry} role="alert">
          Couldn&apos;t load meetings.
        </ListMessage>
      )}

      {!isLoading && !hasError && meetings.length === 0 && (
        <ListMessage
          actionLabel={hasActiveQuery ? "Clear filters" : "+ New Meeting"}
          onAction={hasActiveQuery ? onClearFilters : onNewMeeting}
          primaryAction={!hasActiveQuery}
        >
          {hasActiveQuery
            ? "No meetings match your filters."
            : "No meetings yet."}
        </ListMessage>
      )}

      {!isLoading && !hasError && meetings.length > 0 && (
        <div className="space-y-5">
          {groups.map((group) => (
            <section aria-labelledby={`meeting-group-${group.key}`} key={group.key}>
              <h2
                className="mb-2.5 pl-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ff-muted"
                id={`meeting-group-${group.key}`}
              >
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.meetings.map((meeting) => (
                  <MeetingRow
                    key={meeting.id}
                    meeting={meeting}
                    onDelete={() => onDeleteMeeting(meeting)}
                    onEdit={() => onEditMeeting(meeting)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
