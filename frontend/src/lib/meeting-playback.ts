import type { TranscriptSegment } from "@/lib/api/types";

export function clampPlaybackTime(seconds: number, durationSeconds: number) {
  if (!Number.isFinite(seconds)) {
    return 0;
  }

  return Math.min(Math.max(0, seconds), Math.max(0, durationSeconds));
}

export function findActiveTranscriptSegment(
  segments: TranscriptSegment[],
  currentTimeSeconds: number,
): TranscriptSegment | null {
  const currentTimeMs = Math.max(0, currentTimeSeconds) * 1000;
  let containingSegment: TranscriptSegment | null = null;
  let mostRecentlyStartedSegment: TranscriptSegment | null = null;

  for (const segment of segments) {
    if (
      segment.start_time_ms <= currentTimeMs &&
      (mostRecentlyStartedSegment === null ||
        segment.start_time_ms > mostRecentlyStartedSegment.start_time_ms ||
        (segment.start_time_ms === mostRecentlyStartedSegment.start_time_ms &&
          segment.sequence_index > mostRecentlyStartedSegment.sequence_index))
    ) {
      mostRecentlyStartedSegment = segment;
    }

    if (
      segment.start_time_ms <= currentTimeMs &&
      currentTimeMs < segment.end_time_ms &&
      (containingSegment === null ||
        segment.start_time_ms > containingSegment.start_time_ms ||
        (segment.start_time_ms === containingSegment.start_time_ms &&
          segment.sequence_index > containingSegment.sequence_index))
    ) {
      containingSegment = segment;
    }
  }

  // A containing range wins; during a gap the prior segment remains active
  // until the next timestamp begins, avoiding flickering empty highlights.
  return containingSegment ?? mostRecentlyStartedSegment;
}
