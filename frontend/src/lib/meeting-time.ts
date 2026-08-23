/**
 * Parses a meeting-relative timestamp without accepting ambiguous partial times.
 * MM may exceed 59, while HH:MM:SS requires both minute and second segments
 * to stay within a clock range.
 */
export function parseMeetingTimestamp(value: string): number | null {
  const normalized = value.trim();
  const minuteSecondMatch = /^(\d+):([0-5]\d)$/.exec(normalized);
  const hourMinuteSecondMatch = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(
    normalized,
  );

  let totalSeconds: number;
  if (minuteSecondMatch) {
    totalSeconds =
      Number(minuteSecondMatch[1]) * 60 + Number(minuteSecondMatch[2]);
  } else if (hourMinuteSecondMatch) {
    totalSeconds =
      Number(hourMinuteSecondMatch[1]) * 3600 +
      Number(hourMinuteSecondMatch[2]) * 60 +
      Number(hourMinuteSecondMatch[3]);
  } else {
    return null;
  }

  const milliseconds = totalSeconds * 1000;
  return Number.isSafeInteger(milliseconds) ? milliseconds : null;
}
