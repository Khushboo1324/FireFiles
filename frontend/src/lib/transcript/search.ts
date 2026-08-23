import type { TranscriptSegment } from "@/lib/api/types";

export interface TranscriptMatch {
  end: number;
  index: number;
  segmentId: number;
  start: number;
}

export function moveTranscriptMatchIndex(
  currentIndex: number,
  totalMatches: number,
  direction: 1 | -1,
): number {
  if (totalMatches <= 0) {
    return 0;
  }

  const normalizedCurrent =
    ((currentIndex % totalMatches) + totalMatches) % totalMatches;
  return (normalizedCurrent + direction + totalMatches) % totalMatches;
}

export function findTranscriptMatches(
  segments: TranscriptSegment[],
  query: string,
): TranscriptMatch[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const matches: TranscriptMatch[] = [];

  for (const segment of segments) {
    const normalizedText = segment.text.toLocaleLowerCase();
    let searchFrom = 0;

    while (searchFrom < normalizedText.length) {
      const start = normalizedText.indexOf(normalizedQuery, searchFrom);
      if (start === -1) {
        break;
      }

      matches.push({
        end: start + normalizedQuery.length,
        index: matches.length,
        segmentId: segment.id,
        start,
      });
      // Advancing by the query length produces distinct, renderable occurrences.
      searchFrom = start + normalizedQuery.length;
    }
  }

  return matches;
}
