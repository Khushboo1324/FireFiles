"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { DetailToolRail } from "@/components/meeting-detail/detail-tool-rail";
import { MeetingHeader } from "@/components/meeting-detail/meeting-header";
import { MeetingNotes } from "@/components/meeting-detail/meeting-notes";
import { MeetingPlayer } from "@/components/meeting-detail/meeting-player";
import { SmartSearchPanel } from "@/components/meeting-detail/smart-search-panel";
import { TranscriptPanel } from "@/components/meeting-detail/transcript-panel";
import { useMeetingPlayback } from "@/components/meeting-detail/use-meeting-playback";
import { DeleteMeetingDialog } from "@/components/meetings/delete-meeting-dialog";
import { MeetingFormDialog } from "@/components/meetings/meeting-form-dialog";
import { Icon } from "@/components/ui/icon";
import { Toast, type ToastNotification } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { getMeeting } from "@/lib/api/meetings";
import type { ActionItem, MeetingDetail } from "@/lib/api/types";
import { findActiveTranscriptSegment } from "@/lib/meeting-playback";
import {
  filterTranscriptSegments,
  type SmartFilter,
} from "@/lib/transcript/smart-filters";

interface RequestResult {
  key: string | null;
  meeting: MeetingDetail | null;
  status: number | null;
}

interface MeetingDetailContentProps {
  activeFilter: SmartFilter | null;
  meeting: MeetingDetail;
  onActionItemsChange: (update: (items: ActionItem[]) => ActionItem[]) => void;
  onDelete: () => void;
  onEdit: () => void;
  onNotify: (message: string, tone: "success" | "error") => void;
  onSmartFilterChange: (filter: SmartFilter | null) => void;
}

function MeetingDetailContent({
  activeFilter,
  meeting,
  onActionItemsChange,
  onDelete,
  onEdit,
  onNotify,
  onSmartFilterChange,
}: MeetingDetailContentProps) {
  const mediaElementRef = useRef<HTMLAudioElement>(null);
  const playback = useMeetingPlayback({
    durationSeconds: meeting.duration_seconds,
    mediaElementRef,
    mediaUrl: meeting.media_url,
  });
  const visibleSegments = useMemo(
    () => filterTranscriptSegments(meeting.transcript_segments, activeFilter),
    [activeFilter, meeting.transcript_segments],
  );
  const activeSegment = useMemo(
    () =>
      findActiveTranscriptSegment(
        meeting.transcript_segments,
        playback.currentTimeSeconds,
      ),
    [meeting.transcript_segments, playback.currentTimeSeconds],
  );

  return (
    <main className="meeting-detail-shell bg-white">
      <MeetingHeader onDelete={onDelete} onEdit={onEdit} title={meeting.title} />
      <DetailToolRail />
      <SmartSearchPanel
        actionItemCount={meeting.action_items.length}
        activeFilter={activeFilter}
        onActiveFilterChange={onSmartFilterChange}
        segments={meeting.transcript_segments}
        topics={meeting.topics}
      />
      <MeetingNotes
        actionItemsHighlighted={activeFilter === "tasks"}
        meeting={meeting}
        onActionItemsChange={onActionItemsChange}
        onNotify={onNotify}
        onSeekToMs={playback.seekToMs}
      />
      <TranscriptPanel
        activeFilter={activeFilter}
        activeSegmentId={activeSegment?.id ?? null}
        isPlaying={playback.isPlaying}
        key={meeting.id}
        onClearSmartFilter={() => onSmartFilterChange(null)}
        onSeekToMs={playback.seekToMs}
        seekRequestId={playback.seekRequestId}
        segments={visibleSegments}
      />
      <MeetingPlayer mediaElementRef={mediaElementRef} playback={playback} />
    </main>
  );
}

function PanelSkeleton({ side }: { side: "left" | "right" }) {
  const panelClass =
    side === "left"
      ? "meeting-smart-panel border-r"
      : "meeting-transcript-panel border-l";

  return (
    <aside className={`${panelClass} min-h-0 border-ff-border bg-white`}>
      <div className="flex h-14 items-center border-b border-ff-border px-4">
        <span className="h-3.5 w-24 animate-pulse rounded bg-ff-border-soft" />
      </div>
      <div className="space-y-4 p-4">
        {Array.from({ length: side === "left" ? 6 : 8 }).map((_, index) => (
          <div className="animate-pulse" key={index}>
            <div className="h-3 w-20 rounded bg-ff-border-soft" />
            <div className="mt-2 h-9 rounded bg-ff-muted-surface" />
          </div>
        ))}
      </div>
    </aside>
  );
}

function NotesSkeleton() {
  return (
    <section className="meeting-notes-panel min-h-0 min-w-0 overflow-hidden bg-white px-10 pb-8 pt-24">
      <div className="mx-auto max-w-[720px] animate-pulse">
        <div className="h-7 w-2/5 rounded bg-ff-border-soft" />
        <div className="mt-3 h-3 w-3/5 rounded bg-ff-border-soft" />
        <div className="mt-9 border-b border-ff-border pb-4">
          <div className="h-4 w-44 rounded bg-[#eee9fa]" />
        </div>
        <div className="mt-8 h-4 w-16 rounded bg-ff-border-soft" />
        <div className="mt-5 space-y-3">
          <div className="h-3 w-full rounded bg-ff-muted-surface" />
          <div className="h-3 w-11/12 rounded bg-ff-muted-surface" />
          <div className="h-3 w-4/5 rounded bg-ff-muted-surface" />
        </div>
        <div className="mt-10 h-28 rounded-md border border-ff-border bg-ff-muted-surface" />
      </div>
    </section>
  );
}

function MeetingStateShell({
  kind,
  onRetry,
}: {
  kind: "not-found" | "error";
  onRetry: () => void;
}) {
  const isNotFound = kind === "not-found";

  return (
    <main className="meeting-detail-shell bg-white">
      <MeetingHeader title="Meeting" />
      <DetailToolRail />
      <PanelSkeleton side="left" />
      <section className="meeting-notes-panel flex min-h-0 items-center justify-center bg-white px-6 text-center">
        <div>
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-ff-primary-soft text-ff-primary">
            <Icon name={isNotFound ? "video-library" : "support"} size={21} />
          </span>
          <h1 className="mt-4 text-[17px] font-semibold text-[#273044]">
            {isNotFound ? "Meeting not found." : "Couldn't load this meeting."}
          </h1>
          <p className="mt-2 text-[12px] text-ff-muted">
            {isNotFound
              ? "This meeting may have been removed or the link may be invalid."
              : "Check the connection and try loading the meeting again."}
          </p>
          {isNotFound ? (
            <Link
              className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-ff-primary px-4 text-[12px] font-semibold text-white hover:bg-ff-primary-hover"
              href="/meetings"
            >
              Back to Meetings
            </Link>
          ) : (
            <button
              className="mt-5 h-9 rounded-md bg-ff-primary px-5 text-[12px] font-semibold text-white hover:bg-ff-primary-hover"
              onClick={onRetry}
              type="button"
            >
              Retry
            </button>
          )}
        </div>
      </section>
      <PanelSkeleton side="right" />
      <MeetingPlayer durationSeconds={0} mediaUrl={null} />
    </main>
  );
}

export function MeetingDetailPage({ meetingId }: { meetingId: number | null }) {
  const router = useRouter();
  const [retryVersion, setRetryVersion] = useState(0);
  const [activeFilter, setActiveFilter] = useState<SmartFilter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<ToastNotification | null>(
    null,
  );
  const [requestResult, setRequestResult] = useState<RequestResult>({
    key: null,
    meeting: null,
    status: null,
  });
  const requestKey = `${meetingId ?? "invalid"}:${retryVersion}`;
  useEffect(() => {
    if (meetingId === null) {
      return;
    }

    let ignoreResult = false;

    getMeeting(meetingId)
      .then((meeting) => {
        if (!ignoreResult) {
          setActiveFilter(null);
          setRequestResult({ key: requestKey, meeting, status: null });
        }
      })
      .catch((error: unknown) => {
        if (!ignoreResult) {
          const status = error instanceof ApiError ? error.status : null;
          setRequestResult({ key: requestKey, meeting: null, status });
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [meetingId, requestKey]);

  if (meetingId === null) {
    return <MeetingStateShell kind="not-found" onRetry={() => undefined} />;
  }

  const isLoading = requestResult.key !== requestKey;
  if (isLoading) {
    return (
      <main className="meeting-detail-shell bg-white" aria-busy="true">
        <MeetingHeader isLoading title="" />
        <DetailToolRail />
        <PanelSkeleton side="left" />
        <NotesSkeleton />
        <PanelSkeleton side="right" />
        <MeetingPlayer durationSeconds={0} mediaUrl={null} />
      </main>
    );
  }

  if (!requestResult.meeting) {
    return (
      <MeetingStateShell
        kind={requestResult.status === 404 ? "not-found" : "error"}
        onRetry={() => setRetryVersion((version) => version + 1)}
      />
    );
  }

  const meeting = requestResult.meeting;

  function changeSmartFilter(filter: SmartFilter | null) {
    setActiveFilter(filter);
    if (filter === "tasks") {
      window.requestAnimationFrame(() => {
        document.getElementById("action-items-section")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }

  function showNotification(
    message: string,
    tone: ToastNotification["tone"],
  ) {
    setNotification({ id: Date.now(), message, tone });
  }

  function updateActionItems(
    update: (items: ActionItem[]) => ActionItem[],
  ) {
    // Keeping action items on the loaded meeting makes Smart Search and Notes
    // consume the same list immediately after every mutation.
    setRequestResult((current) =>
      current.meeting
        ? {
            ...current,
            meeting: {
              ...current.meeting,
              action_items: update(current.meeting.action_items),
            },
          }
        : current,
    );
  }

  return (
    <>
      <MeetingDetailContent
        activeFilter={activeFilter}
        key={`${meeting.id}:${meeting.duration_seconds}:${meeting.media_url ?? ""}`}
        meeting={meeting}
        onActionItemsChange={updateActionItems}
        onDelete={() => setIsDeleting(true)}
        onEdit={() => setIsEditing(true)}
        onNotify={showNotification}
        onSmartFilterChange={changeSmartFilter}
      />

      {isEditing && (
        <MeetingFormDialog
          initialMeeting={meeting}
          key={meeting.id}
          meetingId={meeting.id}
          mode="edit"
          onClose={() => setIsEditing(false)}
          onSuccess={(updatedMeeting) => {
            setRequestResult({
              key: requestKey,
              meeting: updatedMeeting,
              status: null,
            });
            setIsEditing(false);
            showNotification("Meeting updated.", "success");
          }}
        />
      )}

      {isDeleting && (
        <DeleteMeetingDialog
          meetingId={meeting.id}
          meetingTitle={meeting.title}
          onClose={() => setIsDeleting(false)}
          onDeleted={() => {
            setIsDeleting(false);
            showNotification("Meeting deleted.", "success");
            window.setTimeout(() => router.push("/meetings"), 550);
          }}
        />
      )}

      <Toast
        notification={notification}
        onDismiss={() => setNotification(null)}
      />
    </>
  );
}
