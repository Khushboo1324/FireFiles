import json

import pytest

from app.parsers.transcript import (
    TranscriptParseError,
    parse_json_transcript,
    parse_timestamped_text,
    parse_vtt_transcript,
)


def test_text_parser_normalizes_mm_ss_and_derives_ends() -> None:
    segments = parse_timestamped_text(
        """
        [00:00] Amara Voss: Thanks everyone for joining.
        [03:14] Dev Malik: The backend change is ready.
        """,
        duration_ms=300_000,
    )

    assert [segment.start_time_ms for segment in segments] == [0, 194_000]
    assert [segment.end_time_ms for segment in segments] == [194_000, 300_000]
    assert [segment.speaker_name for segment in segments] == [
        "Amara Voss",
        "Dev Malik",
    ]


def test_text_parser_supports_hh_mm_ss() -> None:
    segments = parse_timestamped_text(
        "[01:02:18] Nina Calder: Let's revisit the deployment plan.",
        duration_ms=4_000_000,
    )

    assert segments[0].start_time_ms == 3_738_000
    assert segments[0].end_time_ms == 4_000_000


@pytest.mark.parametrize(
    ("content", "error_fragment"),
    [
        ("   \n\t", "must not be blank"),
        ("not a transcript line", "must use"),
        ("[00:00] : hello", "speaker must not be blank"),
        ("[00:00] Amara:   ", "text must not be blank"),
        ("[00:60] Amara: invalid seconds", "Invalid timestamp"),
        (
            "[00:02] Amara: later\n[00:01] Dev: earlier",
            "strictly chronological",
        ),
        (
            "[00:01] Amara: first\n[00:01] Dev: duplicate",
            "strictly chronological",
        ),
        ("[05:00] Amara: at duration", "before the meeting duration"),
        ("[05:01] Amara: beyond duration", "before the meeting duration"),
    ],
)
def test_text_parser_rejects_invalid_content(
    content: str, error_fragment: str
) -> None:
    with pytest.raises(TranscriptParseError, match=error_fragment):
        parse_timestamped_text(content, duration_ms=300_000)


def test_json_parser_normalizes_valid_array() -> None:
    content = json.dumps(
        [
            {
                "speaker": " Amara Voss ",
                "start_time_ms": 0,
                "end_time_ms": 12_000,
                "text": " Thanks everyone for joining. ",
            },
            {
                "speaker": "Dev Malik",
                "start_time_ms": 12_000,
                "end_time_ms": 31_000,
                "text": "The backend changes are ready.",
            },
        ]
    )

    segments = parse_json_transcript(content, duration_ms=60_000)

    assert [(item.start_time_ms, item.end_time_ms) for item in segments] == [
        (0, 12_000),
        (12_000, 31_000),
    ]
    assert segments[0].speaker_name == "Amara Voss"
    assert segments[0].text == "Thanks everyone for joining."


@pytest.mark.parametrize(
    ("content", "error_fragment"),
    [
        ('{"speaker": "Amara"}', "root must be an array"),
        ("not json", "not valid JSON"),
        ("[]", "at least one segment"),
        (
            '[{"speaker":"A","start_time_ms":-1,"end_time_ms":1,"text":"x"}]',
            "non-negative",
        ),
        (
            '[{"speaker":"A","start_time_ms":2,"end_time_ms":1,"text":"x"}]',
            "must not precede",
        ),
        (
            '[{"speaker":"A","start_time_ms":0,"end_time_ms":60001,"text":"x"}]',
            "exceeds meeting duration",
        ),
        (
            '[{"speaker":"A","start_time_ms":0,"end_time_ms":1,"text":"x","sequence_index":9}]',
            "unexpected fields",
        ),
    ],
)
def test_json_parser_rejects_invalid_content(
    content: str, error_fragment: str
) -> None:
    with pytest.raises(TranscriptParseError, match=error_fragment):
        parse_json_transcript(content, duration_ms=60_000)


def test_vtt_parser_normalizes_representative_cues() -> None:
    segments = parse_vtt_transcript(
        """WEBVTT

00:00:00.000 --> 00:00:05.000
Amara Voss: Thanks everyone for joining.

00:00:05.000 --> 00:00:11.500
Dev Malik: The backend changes are ready.
""",
        duration_ms=15_000,
    )

    assert [(item.start_time_ms, item.end_time_ms) for item in segments] == [
        (0, 5_000),
        (5_000, 11_500),
    ]


@pytest.mark.parametrize(
    "content",
    [
        "WEBVTT\n\nnot timing\nAmara: Hello",
        "WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nmissing separator",
    ],
)
def test_vtt_parser_rejects_malformed_cue(content: str) -> None:
    with pytest.raises(TranscriptParseError):
        parse_vtt_transcript(content, duration_ms=10_000)
