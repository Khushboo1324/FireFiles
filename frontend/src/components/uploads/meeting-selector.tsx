"use client";

import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { listMeetings } from "@/lib/api/meetings";
import type { MeetingListItem } from "@/lib/api/types";
import {
  formatMeetingDate,
  formatMeetingTime,
} from "@/lib/formatters/meeting";

interface MeetingRequestState {
  meetings: MeetingListItem[];
  isLoading: boolean;
  hasError: boolean;
}

export function MeetingSelector({
  selectedMeetingId,
  onSelect,
  showValidation,
}: {
  selectedMeetingId: number | null;
  onSelect: (meetingId: number) => void;
  showValidation: boolean;
}) {
  const [search, setSearch] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);
  const [requestState, setRequestState] = useState<MeetingRequestState>({
    meetings: [],
    isLoading: true,
    hasError: false,
  });

  useEffect(() => {
    let ignoreResult = false;

    listMeetings({ limit: 100, offset: 0, sort: "newest" })
      .then((response) => {
        if (!ignoreResult) {
          setRequestState({
            meetings: response.items,
            isLoading: false,
            hasError: false,
          });
        }
      })
      .catch(() => {
        if (!ignoreResult) {
          setRequestState({ meetings: [], isLoading: false, hasError: true });
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [retryVersion]);

  const filteredMeetings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) {
      return requestState.meetings;
    }
    return requestState.meetings.filter((meeting) =>
      [meeting.title, ...meeting.participants.map((participant) => participant.name)]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [requestState.meetings, search]);

  return (
    <fieldset>
      <legend className="text-[12px] font-semibold text-ff-text">
        Choose a meeting
      </legend>
      <label className="relative mt-2 block">
        <span className="sr-only">Search meetings</span>
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ff-muted"
          name="search"
          size={15}
        />
        <input
          className="h-9 w-full rounded-md border border-ff-border bg-ff-muted-surface pl-9 pr-3 text-[12px] text-ff-text outline-none placeholder:text-[#98a1b3] focus:border-ff-primary focus:bg-white focus:ring-1 focus:ring-ff-primary"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by meeting or participant"
          type="search"
          value={search}
        />
      </label>

      <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-ff-border bg-white p-1">
        {requestState.isLoading ? (
          <p className="px-3 py-5 text-center text-[12px] text-ff-muted">
            Loading meetings...
          </p>
        ) : requestState.hasError ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[12px] text-ff-error">Couldn&apos;t load meetings.</p>
            <button
              className="mt-2 text-[12px] font-semibold text-ff-primary hover:underline"
              onClick={() => {
                setRequestState((current) => ({
                  ...current,
                  isLoading: true,
                  hasError: false,
                }));
                setRetryVersion((version) => version + 1);
              }}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <p className="px-3 py-5 text-center text-[12px] text-ff-muted">
            {search.trim() ? "No matching meetings." : "No meetings available."}
          </p>
        ) : (
          filteredMeetings.map((meeting) => {
            const isSelected = meeting.id === selectedMeetingId;
            const participants = meeting.participants
              .map((participant) => participant.name)
              .join(", ");
            return (
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded px-2.5 py-2 transition-colors ${
                  isSelected ? "bg-ff-primary-soft" : "hover:bg-ff-muted-surface"
                }`}
                key={meeting.id}
              >
                <input
                  checked={isSelected}
                  className="mt-0.5 accent-[#630ed4]"
                  name="meeting"
                  onChange={() => onSelect(meeting.id)}
                  type="radio"
                  value={meeting.id}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-ff-text">
                    {meeting.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-ff-muted">
                    {formatMeetingDate(meeting.meeting_date)} at{" "}
                    {formatMeetingTime(meeting.meeting_date)}
                    {participants ? ` · ${participants}` : ""}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
      {showValidation && selectedMeetingId === null && (
        <p className="mt-1.5 text-[11px] font-medium text-ff-error">
          Select a meeting.
        </p>
      )}
    </fieldset>
  );
}
