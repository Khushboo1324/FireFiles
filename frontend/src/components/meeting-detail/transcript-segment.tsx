import { ParticipantAvatar } from "@/components/meeting-detail/participant-avatar";
import type { TranscriptSegment as TranscriptSegmentData } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/formatters/meeting";
import type { TranscriptMatch } from "@/lib/transcript/search";

export function TranscriptSegment({
  currentMatchIndex,
  matches,
  segment,
}: {
  currentMatchIndex: number;
  matches: TranscriptMatch[];
  segment: TranscriptSegmentData;
}) {
  return (
    <article
      className="border-b border-ff-border-soft py-4 last:border-b-0"
      data-transcript-segment={segment.id}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {segment.speaker ? (
            <ParticipantAvatar participant={segment.speaker} size="small" />
          ) : (
            <span
              aria-label="Unknown speaker"
              className="flex size-5 shrink-0 items-center justify-center rounded-md bg-[#eceef2] text-[8px] font-semibold text-[#7b8496]"
              role="img"
            >
              ?
            </span>
          )}
          <h3 className="truncate text-[11px] font-semibold text-[#39445a]">
            {segment.speaker?.name ?? "Unknown speaker"}
          </h3>
        </div>
        <button
          className="shrink-0 text-[10px] font-semibold text-[#6d42d8] underline-offset-2 disabled:opacity-100"
          disabled
          title="Seeking will be added in a later step"
          type="button"
        >
          {formatTimestamp(segment.start_time_ms)}
        </button>
      </div>
      <p className="pl-7 text-[11px] leading-[18px] text-[#4a566d]">
        {matches.map((match, matchPosition) => {
          const previousEnd =
            matchPosition === 0 ? 0 : matches[matchPosition - 1].end;
          const before = segment.text.slice(previousEnd, match.start);
          const matchedText = segment.text.slice(match.start, match.end);

          return (
            <span key={`${match.start}-${match.index}`}>
              {before}
              <mark
                className={`rounded-sm px-0.5 text-inherit ${
                  match.index === currentMatchIndex
                    ? "bg-[#f5df7a] ring-1 ring-[#8a5de7]"
                    : "bg-[#fff1a8]"
                }`}
                id={`transcript-match-${match.index}`}
              >
                {matchedText}
              </mark>
            </span>
          );
        })}
        {segment.text.slice(matches.at(-1)?.end ?? 0)}
      </p>
    </article>
  );
}
