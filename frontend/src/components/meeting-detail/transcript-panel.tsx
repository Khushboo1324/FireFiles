import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { TranscriptSearch } from "@/components/meeting-detail/transcript-search";
import { TranscriptSegment } from "@/components/meeting-detail/transcript-segment";
import { Icon } from "@/components/ui/icon";
import type { TranscriptSegment as TranscriptSegmentData } from "@/lib/api/types";
import {
  findTranscriptMatches,
  moveTranscriptMatchIndex,
} from "@/lib/transcript/search";
import type { SmartFilter } from "@/lib/transcript/smart-filters";

const filterLabels: Record<Exclude<SmartFilter, "tasks">, string> = {
  questions: "Questions",
  metrics: "Metrics",
  "date-time": "Date & Time",
};

interface TranscriptPanelProps {
  activeSegmentId: number | null;
  activeFilter: SmartFilter | null;
  isPlaying: boolean;
  onClearSmartFilter: () => void;
  onSeekToMs: (milliseconds: number) => void;
  seekRequestId: number;
  segments: TranscriptSegmentData[];
}

export function TranscriptPanel({
  activeSegmentId,
  activeFilter,
  isPlaying,
  onClearSmartFilter,
  onSeekToMs,
  seekRequestId,
  segments,
}: TranscriptPanelProps) {
  const [query, setQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const previousActiveSegmentId = useRef<number | null>(activeSegmentId);
  const previousSeekRequestId = useRef(seekRequestId);
  const matches = useMemo(
    () => findTranscriptMatches(segments, query),
    [query, segments],
  );
  const normalizedCurrentIndex =
    matches.length === 0
      ? -1
      : ((currentMatchIndex % matches.length) + matches.length) % matches.length;
  const matchesBySegment = useMemo(() => {
    const groupedMatches = new Map<number, typeof matches>();
    for (const match of matches) {
      const current = groupedMatches.get(match.segmentId) ?? [];
      groupedMatches.set(match.segmentId, [...current, match]);
    }
    return groupedMatches;
  }, [matches]);
  const transcriptFilter = activeFilter && activeFilter !== "tasks" ? activeFilter : null;

  useEffect(() => {
    if (normalizedCurrentIndex < 0) {
      return;
    }

    const currentMatch = document.getElementById(
      `transcript-match-${normalizedCurrentIndex}`,
    );
    currentMatch
      ?.closest<HTMLElement>("[data-transcript-segment]")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [matches, normalizedCurrentIndex]);

  useEffect(() => {
    const activeSegmentChanged =
      previousActiveSegmentId.current !== activeSegmentId;
    const userSought = previousSeekRequestId.current !== seekRequestId;
    previousActiveSegmentId.current = activeSegmentId;
    previousSeekRequestId.current = seekRequestId;

    // While find-in-transcript is active, its current match owns scroll position;
    // playback highlighting should not pull the reader to a different segment.
    if (
      query.trim() ||
      !activeSegmentChanged ||
      (!isPlaying && !userSought)
    ) {
      return;
    }

    document
      .getElementById(`transcript-segment-${activeSegmentId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeSegmentId, isPlaying, query, seekRequestId]);

  function moveMatch(direction: 1 | -1) {
    if (matches.length === 0) {
      return;
    }
    setCurrentMatchIndex((current) =>
      moveTranscriptMatchIndex(current, matches.length, direction),
    );
  }

  function changeQuery(value: string) {
    setQuery(value);
    setCurrentMatchIndex(0);
  }

  return (
    <aside className="meeting-transcript-panel flex min-h-0 min-w-0 flex-col border-l border-ff-border bg-white">
      <div
        className="flex h-14 shrink-0 items-end border-b border-ff-border px-3"
        role="tablist"
      >
        <button
          aria-selected="false"
          className="flex h-full items-center gap-1.5 border-b-2 border-transparent px-3 text-[12px] font-medium text-[#778196] disabled:opacity-100"
          disabled
          role="tab"
          title="Ask FireFiles — available in an upcoming step"
          type="button"
        >
          <Icon name="smart-toy" size={16} />
          Ask FireFiles
        </button>
        <button
          aria-selected="true"
          className="flex h-full items-center border-b-2 border-ff-primary px-3 text-[12px] font-semibold text-ff-primary"
          role="tab"
          type="button"
        >
          Transcript
        </button>
        <div className="ml-auto flex h-full items-center gap-0.5 text-ff-muted">
          <button
            aria-label="Expand transcript"
            className="flex size-7 items-center justify-center rounded disabled:opacity-100"
            disabled
            title="Expand — available in an upcoming step"
            type="button"
          >
            <Icon name="expand" size={15} />
          </button>
          <button
            aria-label="Copy transcript"
            className="flex size-7 items-center justify-center rounded disabled:opacity-100"
            disabled
            title="Copy transcript — available in an upcoming step"
            type="button"
          >
            <Icon name="copy" size={15} />
          </button>
        </div>
      </div>

      <div className="shrink-0 border-b border-ff-border p-3.5">
        <TranscriptSearch
          currentMatch={normalizedCurrentIndex < 0 ? 0 : normalizedCurrentIndex + 1}
          onChange={changeQuery}
          onNext={() => moveMatch(1)}
          onPrevious={() => moveMatch(-1)}
          query={query}
          totalMatches={matches.length}
        />
      </div>

      {transcriptFilter && (
        <div className="flex shrink-0 items-center justify-between border-b border-[#e6def5] bg-[#faf8ff] px-4 py-2 text-[10px] text-[#685194]">
          <span>
            Smart Search: {filterLabels[transcriptFilter]} · {segments.length} segments
          </span>
          <button
            className="font-semibold text-ff-primary hover:underline"
            onClick={onClearSmartFilter}
            type="button"
          >
            Clear
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {segments.length > 0 ? (
          segments.map((segment) => (
            <TranscriptSegment
              isActive={segment.id === activeSegmentId}
              currentMatchIndex={normalizedCurrentIndex}
              key={segment.id}
              matches={matchesBySegment.get(segment.id) ?? []}
              onSeek={onSeekToMs}
              segment={segment}
            />
          ))
        ) : (
          <div className="px-3 py-10 text-center">
            <Icon className="mx-auto text-[#a4aabc]" name="chat-bubble" size={21} />
            <p className="mt-3 text-[12px] text-ff-muted">
              {transcriptFilter
                ? `No transcript segments match ${filterLabels[transcriptFilter]}.`
                : "No transcript available yet."}
            </p>
            {transcriptFilter && (
              <button
                className="mt-3 text-[11px] font-semibold text-ff-primary hover:underline"
                onClick={onClearSmartFilter}
                type="button"
              >
                Clear filter
              </button>
            )}
            {!transcriptFilter && (
              <Link
                className="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-[#ded5ef] bg-white px-3 text-[11px] font-semibold text-ff-primary hover:bg-[#f8f5ff]"
                href="/uploads"
              >
                Import transcript
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
