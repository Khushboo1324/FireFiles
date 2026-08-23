"use client";

import { useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { DeleteMeetingDialog } from "@/components/meetings/delete-meeting-dialog";
import { MeetingFormDialog } from "@/components/meetings/meeting-form-dialog";
import { MeetingList } from "@/components/meetings/meeting-list";
import { MeetingsToolbar } from "@/components/meetings/meetings-toolbar";
import { Toast, type ToastNotification } from "@/components/ui/toast";
import { listMeetings, type MeetingSort } from "@/lib/api/meetings";
import type { MeetingListItem, MeetingListResponse } from "@/lib/api/types";

const MEETING_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 320;

interface RequestResult {
  key: string | null;
  response: MeetingListResponse | null;
  hasError: boolean;
}

export function MeetingsWorkspace() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [participant, setParticipant] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<MeetingSort>("newest");
  const [participantOptions, setParticipantOptions] = useState<string[]>([]);
  const [requestResult, setRequestResult] = useState<RequestResult>({
    key: null,
    response: null,
    hasError: false,
  });
  const [retryVersion, setRetryVersion] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<MeetingListItem | null>(
    null,
  );
  const [notification, setNotification] = useState<ToastNotification | null>(
    null,
  );
  const requestKey = JSON.stringify([
    debouncedSearch,
    participant,
    dateFrom,
    dateTo,
    sort,
    retryVersion,
  ]);

  useEffect(() => {
    // Debouncing keeps the search backed by FastAPI without issuing a request per keypress.
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let ignoreResult = false;

    listMeetings({
      search: debouncedSearch || undefined,
      participant: participant || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort,
      limit: MEETING_LIMIT,
      offset: 0,
    })
      .then((nextResponse) => {
        if (ignoreResult) {
          return;
        }

        setRequestResult({
          key: requestKey,
          response: nextResponse,
          hasError: false,
        });
        setParticipantOptions((currentOptions) => {
          const names = nextResponse.items.flatMap((meeting) =>
            meeting.participants.map((item) => item.name),
          );
          return Array.from(new Set([...currentOptions, ...names])).sort(
            (first, second) => first.localeCompare(second),
          );
        });
      })
      .catch(() => {
        if (!ignoreResult) {
          setRequestResult({ key: requestKey, response: null, hasError: true });
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [
    debouncedSearch,
    participant,
    dateFrom,
    dateTo,
    sort,
    retryVersion,
    requestKey,
  ]);

  function clearToolbarFilters() {
    setParticipant("");
    setDateFrom("");
    setDateTo("");
    setSort("newest");
  }

  function clearAllFilters() {
    setSearch("");
    setDebouncedSearch("");
    clearToolbarFilters();
  }

  function showNotification(
    message: string,
    tone: ToastNotification["tone"],
  ) {
    setNotification({ id: Date.now(), message, tone });
  }

  function removeDeletedMeeting(meetingId: number) {
    setRequestResult((current) => {
      if (!current.response) {
        return current;
      }
      const isVisible = current.response.items.some(
        (meeting) => meeting.id === meetingId,
      );
      return {
        ...current,
        response: {
          items: current.response.items.filter(
            (meeting) => meeting.id !== meetingId,
          ),
          total: Math.max(0, current.response.total - Number(isVisible)),
        },
      };
    });
  }

  const hasActiveQuery = Boolean(
    search.trim() || participant || dateFrom || dateTo,
  );
  const isLoading = requestResult.key !== requestKey;
  const hasError = !isLoading && requestResult.hasError;
  const response = isLoading ? null : requestResult.response;

  return (
    <>
      <AppHeader
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search by title or keyword",
        }}
        title="Meetings"
      />

      <section className="meetings-workspace flex h-full min-h-0 min-w-0 flex-col border-r border-ff-border bg-white">
        <MeetingsToolbar
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClearFilters={clearToolbarFilters}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onParticipantChange={setParticipant}
          onNewMeeting={() => setIsCreating(true)}
          onSortChange={setSort}
          participant={participant}
          participantOptions={participantOptions}
          sort={sort}
        />

        <MeetingList
          hasActiveQuery={hasActiveQuery}
          hasError={hasError}
          isLoading={isLoading}
          meetings={response?.items ?? []}
          onClearFilters={clearAllFilters}
          onDeleteMeeting={setDeletingMeeting}
          onEditMeeting={(meeting) => setEditingMeetingId(meeting.id)}
          onNewMeeting={() => setIsCreating(true)}
          onRetry={() => setRetryVersion((version) => version + 1)}
        />
      </section>

      {isCreating && (
        <MeetingFormDialog
          mode="create"
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            setRetryVersion((version) => version + 1);
            showNotification("Meeting created.", "success");
          }}
        />
      )}

      {editingMeetingId !== null && (
        <MeetingFormDialog
          key={editingMeetingId}
          meetingId={editingMeetingId}
          mode="edit"
          onClose={() => setEditingMeetingId(null)}
          onSuccess={() => {
            setEditingMeetingId(null);
            setRetryVersion((version) => version + 1);
            showNotification("Meeting updated.", "success");
          }}
        />
      )}

      {deletingMeeting && (
        <DeleteMeetingDialog
          meetingId={deletingMeeting.id}
          meetingTitle={deletingMeeting.title}
          onClose={() => setDeletingMeeting(null)}
          onDeleted={() => {
            removeDeletedMeeting(deletingMeeting.id);
            setDeletingMeeting(null);
            showNotification("Meeting deleted.", "success");
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
