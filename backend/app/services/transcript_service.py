from __future__ import annotations

from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Meeting, MeetingParticipant, Participant, TranscriptSegment
from app.parsers.transcript import (
    TranscriptParser,
    parse_json_transcript,
    parse_timestamped_text,
    parse_vtt_transcript,
)
from app.services.meeting_service import get_meeting_detail


TranscriptFormat = Literal["txt", "json", "vtt"]


class TranscriptMeetingNotFoundError(Exception):
    """Raised when an import targets a meeting that does not exist."""


class TranscriptAlreadyExistsError(Exception):
    """Raised when appending would violate transcript replacement semantics."""


_PARSERS: dict[TranscriptFormat, TranscriptParser] = {
    "txt": parse_timestamped_text,
    "json": parse_json_transcript,
    "vtt": parse_vtt_transcript,
}


def _load_meeting_for_import(session: Session, meeting_id: int) -> Meeting | None:
    return session.scalar(
        select(Meeting)
        .where(Meeting.id == meeting_id)
        .options(
            selectinload(Meeting.participant_links).selectinload(
                MeetingParticipant.participant
            ),
            selectinload(Meeting.transcript_segments),
        )
    )


def _reload_meeting_detail(session: Session, meeting_id: int) -> Meeting:
    session.expire_all()
    meeting = get_meeting_detail(session, meeting_id)
    if meeting is None:
        raise RuntimeError("Committed meeting could not be reloaded")
    return meeting


def import_transcript(
    session: Session,
    meeting_id: int,
    content: str,
    transcript_format: TranscriptFormat,
    *,
    replace_existing: bool = False,
) -> Meeting:
    try:
        meeting = _load_meeting_for_import(session, meeting_id)
        if meeting is None:
            raise TranscriptMeetingNotFoundError("Meeting not found")
        if meeting.transcript_segments and not replace_existing:
            raise TranscriptAlreadyExistsError("Meeting already has a transcript")

        # Complete parsing occurs before replacement so malformed input never causes
        # the current good transcript to be removed, even temporarily in the unit.
        parsed_segments = _PARSERS[transcript_format](
            content, meeting.duration_seconds * 1_000
        )

        if meeting.transcript_segments:
            meeting.transcript_segments.clear()
            # Flush deletions before reusing sequence indexes protected by a unique key.
            session.flush()

        participants_by_name = {
            link.participant.name.strip().casefold(): link.participant
            for link in meeting.participant_links
        }
        transcript_segments: list[TranscriptSegment] = []
        for sequence_index, parsed in enumerate(parsed_segments):
            name_key = parsed.speaker_name.casefold()
            participant = participants_by_name.get(name_key)
            if participant is None:
                # A name is not a global identity, so unknown speakers become people
                # scoped through this meeting rather than reusing an unrelated record.
                participant = Participant(
                    name=parsed.speaker_name,
                    email=None,
                    avatar_url=None,
                )
                meeting.participant_links.append(
                    MeetingParticipant(participant=participant, is_organizer=False)
                )
                participants_by_name[name_key] = participant

            transcript_segments.append(
                TranscriptSegment(
                    speaker=participant,
                    sequence_index=sequence_index,
                    start_time_ms=parsed.start_time_ms,
                    end_time_ms=parsed.end_time_ms,
                    text=parsed.text,
                )
            )

        meeting.transcript_segments = transcript_segments
        session.commit()
        return _reload_meeting_detail(session, meeting.id)
    except Exception:
        # Participant creation and replacement live in the same transaction as all
        # segment inserts, so any failure restores the complete prior meeting state.
        session.rollback()
        raise
