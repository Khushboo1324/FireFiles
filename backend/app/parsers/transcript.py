from __future__ import annotations

from dataclasses import dataclass
import json
import re
from typing import Callable


class TranscriptParseError(ValueError):
    """Raised when imported transcript content cannot be safely normalized."""


@dataclass(frozen=True, slots=True)
class ParsedTranscriptSegment:
    speaker_name: str
    start_time_ms: int
    end_time_ms: int
    text: str


_TEXT_LINE_PATTERN = re.compile(
    r"^\[(?P<timestamp>[^\]]+)\]\s*(?P<speaker>[^:]*):(?P<text>.*)$"
)
_TEXT_TIMESTAMP_PATTERN = re.compile(r"^(?:\d{2}:\d{2}|\d{2}:\d{2}:\d{2})$")
_VTT_TIMESTAMP_PATTERN = re.compile(
    r"^(?:(?P<hours>\d{2,}):)?(?P<minutes>\d{2}):"
    r"(?P<seconds>\d{2})\.(?P<milliseconds>\d{3})$"
)
_VTT_TIMING_PATTERN = re.compile(
    r"^(?P<start>\S+)\s+-->\s+(?P<end>\S+)(?:\s+.*)?$"
)


def _validate_duration(duration_ms: int) -> None:
    if duration_ms < 0:
        raise ValueError("duration_ms must be non-negative")


def _parse_text_timestamp(value: str) -> int:
    if not _TEXT_TIMESTAMP_PATTERN.fullmatch(value):
        raise TranscriptParseError(f"Invalid timestamp: {value}")

    components = [int(component) for component in value.split(":")]
    if len(components) == 2:
        hours = 0
        minutes, seconds = components
    else:
        hours, minutes, seconds = components
    if minutes >= 60 or seconds >= 60:
        raise TranscriptParseError(f"Invalid timestamp: {value}")
    return ((hours * 60 + minutes) * 60 + seconds) * 1_000


def _parse_speaker_text(value: str, *, context: str) -> tuple[str, str]:
    speaker, separator, text = value.partition(":")
    if not separator:
        raise TranscriptParseError(f"{context} must use 'Speaker Name: text'")
    speaker = speaker.strip()
    text = text.strip()
    if not speaker:
        raise TranscriptParseError(f"{context} speaker must not be blank")
    if not text:
        raise TranscriptParseError(f"{context} text must not be blank")
    return speaker, text


def parse_timestamped_text(
    content: str, duration_ms: int
) -> list[ParsedTranscriptSegment]:
    """Parse timestamped text and derive each missing end from the next start."""
    _validate_duration(duration_ms)
    if not content.strip():
        raise TranscriptParseError("Transcript must not be blank")

    starts_and_text: list[tuple[str, int, str]] = []
    for line_number, raw_line in enumerate(content.strip().splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            continue
        match = _TEXT_LINE_PATTERN.fullmatch(line)
        if match is None:
            raise TranscriptParseError(
                f"Line {line_number} must use '[MM:SS] Speaker Name: text'"
            )
        speaker = match.group("speaker").strip()
        text = match.group("text").strip()
        if not speaker:
            raise TranscriptParseError(f"Line {line_number} speaker must not be blank")
        if not text:
            raise TranscriptParseError(f"Line {line_number} text must not be blank")
        start_time_ms = _parse_text_timestamp(match.group("timestamp"))
        if starts_and_text and start_time_ms <= starts_and_text[-1][1]:
            raise TranscriptParseError(
                "Transcript start timestamps must be strictly chronological"
            )
        starts_and_text.append((speaker, start_time_ms, text))

    if not starts_and_text:
        raise TranscriptParseError("Transcript must contain at least one segment")
    if starts_and_text[-1][1] >= duration_ms:
        raise TranscriptParseError(
            "Transcript start timestamp must be before the meeting duration"
        )

    segments: list[ParsedTranscriptSegment] = []
    for index, (speaker, start_time_ms, text) in enumerate(starts_and_text):
        # Text imports omit ends, so the next speaker turn is the only non-invented
        # boundary; the meeting duration closes the final turn.
        end_time_ms = (
            starts_and_text[index + 1][1]
            if index + 1 < len(starts_and_text)
            else duration_ms
        )
        if end_time_ms <= start_time_ms:
            raise TranscriptParseError("Transcript segment timing is invalid")
        segments.append(
            ParsedTranscriptSegment(
                speaker_name=speaker,
                start_time_ms=start_time_ms,
                end_time_ms=end_time_ms,
                text=text,
            )
        )
    return segments


def _require_json_integer(value: object, *, field: str, index: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise TranscriptParseError(f"JSON segment {index} {field} must be an integer")
    return value


def parse_json_transcript(
    content: str, duration_ms: int
) -> list[ParsedTranscriptSegment]:
    _validate_duration(duration_ms)
    try:
        payload = json.loads(content)
    except (json.JSONDecodeError, TypeError) as exc:
        raise TranscriptParseError("Transcript is not valid JSON") from exc

    if not isinstance(payload, list):
        raise TranscriptParseError("JSON transcript root must be an array")
    if not payload:
        raise TranscriptParseError("Transcript must contain at least one segment")

    expected_fields = {"speaker", "start_time_ms", "end_time_ms", "text"}
    segments: list[ParsedTranscriptSegment] = []
    previous_start: int | None = None
    for index, item in enumerate(payload):
        if not isinstance(item, dict):
            raise TranscriptParseError(f"JSON segment {index} must be an object")
        item_fields = set(item)
        if item_fields != expected_fields:
            missing = expected_fields - item_fields
            unexpected = item_fields - expected_fields
            if missing:
                detail = f"missing fields: {', '.join(sorted(missing))}"
            else:
                detail = f"unexpected fields: {', '.join(sorted(unexpected))}"
            raise TranscriptParseError(f"JSON segment {index} has {detail}")

        speaker = item["speaker"]
        text = item["text"]
        if not isinstance(speaker, str) or not speaker.strip():
            raise TranscriptParseError(f"JSON segment {index} speaker must not be blank")
        if not isinstance(text, str) or not text.strip():
            raise TranscriptParseError(f"JSON segment {index} text must not be blank")
        start_time_ms = _require_json_integer(
            item["start_time_ms"], field="start_time_ms", index=index
        )
        end_time_ms = _require_json_integer(
            item["end_time_ms"], field="end_time_ms", index=index
        )
        if start_time_ms < 0:
            raise TranscriptParseError("Transcript timestamps must be non-negative")
        if end_time_ms < start_time_ms:
            raise TranscriptParseError(
                f"JSON segment {index} end_time_ms must not precede start_time_ms"
            )
        if previous_start is not None and start_time_ms < previous_start:
            raise TranscriptParseError("JSON segments must be chronological")
        if start_time_ms > duration_ms or end_time_ms > duration_ms:
            raise TranscriptParseError("Transcript timestamp exceeds meeting duration")

        segments.append(
            ParsedTranscriptSegment(
                speaker_name=speaker.strip(),
                start_time_ms=start_time_ms,
                end_time_ms=end_time_ms,
                text=text.strip(),
            )
        )
        previous_start = start_time_ms
    return segments


def _parse_vtt_timestamp(value: str) -> int:
    match = _VTT_TIMESTAMP_PATTERN.fullmatch(value)
    if match is None:
        raise TranscriptParseError(f"Invalid WebVTT timestamp: {value}")
    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes"))
    seconds = int(match.group("seconds"))
    if minutes >= 60 or seconds >= 60:
        raise TranscriptParseError(f"Invalid WebVTT timestamp: {value}")
    return (
        ((hours * 60 + minutes) * 60 + seconds) * 1_000
        + int(match.group("milliseconds"))
    )


def parse_vtt_transcript(
    content: str, duration_ms: int
) -> list[ParsedTranscriptSegment]:
    """Parse the focused cue form needed by transcript uploads, not full WebVTT."""
    _validate_duration(duration_ms)
    normalized = content.lstrip("\ufeff").strip()
    if not normalized:
        raise TranscriptParseError("Transcript must not be blank")
    lines = normalized.splitlines()
    if lines[0].strip() != "WEBVTT":
        raise TranscriptParseError("WebVTT transcript must begin with WEBVTT")

    body = "\n".join(lines[1:]).strip()
    if not body:
        raise TranscriptParseError("Transcript must contain at least one segment")
    blocks = re.split(r"\n\s*\n", body)
    segments: list[ParsedTranscriptSegment] = []
    previous_start: int | None = None
    for index, block in enumerate(blocks):
        cue_lines = [line.strip() for line in block.splitlines() if line.strip()]
        if len(cue_lines) != 2:
            raise TranscriptParseError(
                f"WebVTT cue {index} must contain one timing and one speaker line"
            )
        timing = _VTT_TIMING_PATTERN.fullmatch(cue_lines[0])
        if timing is None:
            raise TranscriptParseError(f"WebVTT cue {index} timing is invalid")
        start_time_ms = _parse_vtt_timestamp(timing.group("start"))
        end_time_ms = _parse_vtt_timestamp(timing.group("end"))
        speaker, text = _parse_speaker_text(
            cue_lines[1], context=f"WebVTT cue {index}"
        )
        if end_time_ms < start_time_ms:
            raise TranscriptParseError(
                f"WebVTT cue {index} end must not precede start"
            )
        if previous_start is not None and start_time_ms < previous_start:
            raise TranscriptParseError("WebVTT cues must be chronological")
        if start_time_ms > duration_ms or end_time_ms > duration_ms:
            raise TranscriptParseError("Transcript timestamp exceeds meeting duration")
        segments.append(
            ParsedTranscriptSegment(
                speaker_name=speaker,
                start_time_ms=start_time_ms,
                end_time_ms=end_time_ms,
                text=text,
            )
        )
        previous_start = start_time_ms
    return segments


TranscriptParser = Callable[[str, int], list[ParsedTranscriptSegment]]
