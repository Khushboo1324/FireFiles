import type { ParticipantCompact, TranscriptSegment } from "@/lib/api/types";

export type SmartFilter = "questions" | "tasks" | "metrics" | "date-time";

export interface SmartFilterCounts {
  "date-time": number;
  metrics: number;
  questions: number;
  tasks: number;
}

export interface SpeakerTalktime {
  durationMs: number;
  participant: ParticipantCompact;
  percentage: number;
}

const METRIC_PATTERN =
  /(?:[$€£₹]\s?\d[\d,.]*|\b\d+(?:\.\d+)?\s?(?:%|x|users?|people|items?|points?|seconds?|minutes?|hours?|days?|weeks?|months?|ms|kb|mb|gb)\b|\b\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\b)/i;

const DATE_TIME_PATTERNS = [
  /\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?[ap]m)?\b/i,
  /\b(?:1[0-2]|0?[1-9])\s?[ap]m\b/i,
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}\b/i,
  /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/,
  /\b\d{4}-\d{2}-\d{2}\b/,
];

export function segmentMatchesSmartFilter(
  segment: TranscriptSegment,
  filter: Exclude<SmartFilter, "tasks">,
): boolean {
  if (filter === "questions") {
    return segment.text.includes("?");
  }
  if (filter === "metrics") {
    return METRIC_PATTERN.test(segment.text);
  }
  return DATE_TIME_PATTERNS.some((pattern) => pattern.test(segment.text));
}

export function countSmartFilters(
  segments: TranscriptSegment[],
  actionItemCount: number,
): SmartFilterCounts {
  return {
    questions: segments.filter((segment) =>
      segmentMatchesSmartFilter(segment, "questions"),
    ).length,
    tasks: actionItemCount,
    metrics: segments.filter((segment) =>
      segmentMatchesSmartFilter(segment, "metrics"),
    ).length,
    "date-time": segments.filter((segment) =>
      segmentMatchesSmartFilter(segment, "date-time"),
    ).length,
  };
}

export function filterTranscriptSegments(
  segments: TranscriptSegment[],
  filter: SmartFilter | null,
): TranscriptSegment[] {
  // Tasks focuses the real action-item section; it is not a transcript classifier.
  if (!filter || filter === "tasks") {
    return segments;
  }
  return segments.filter((segment) => segmentMatchesSmartFilter(segment, filter));
}

export function deriveSpeakerTalktime(
  segments: TranscriptSegment[],
): SpeakerTalktime[] {
  const durationBySpeaker = new Map<
    number,
    { durationMs: number; participant: ParticipantCompact }
  >();

  for (const segment of segments) {
    if (!segment.speaker) {
      continue;
    }

    const durationMs = Math.max(0, segment.end_time_ms - segment.start_time_ms);
    const current = durationBySpeaker.get(segment.speaker.id);
    durationBySpeaker.set(segment.speaker.id, {
      durationMs: (current?.durationMs ?? 0) + durationMs,
      participant: segment.speaker,
    });
  }

  const totalKnownDuration = Array.from(durationBySpeaker.values()).reduce(
    (total, speaker) => total + speaker.durationMs,
    0,
  );

  return Array.from(durationBySpeaker.values())
    .map(({ durationMs, participant }) => ({
      durationMs,
      participant,
      percentage:
        totalKnownDuration === 0 ? 0 : (durationMs / totalKnownDuration) * 100,
    }))
    .sort((first, second) => second.durationMs - first.durationMs);
}
