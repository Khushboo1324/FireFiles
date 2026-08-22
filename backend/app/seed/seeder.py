from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass

from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import (
    ActionItem,
    Chapter,
    Meeting,
    MeetingParticipant,
    Participant,
    Summary,
    Topic,
    TranscriptSegment,
)
from app.seed.fixtures import (
    CANONICAL_MEETING_TITLES,
    MEETINGS,
    PARTICIPANTS,
    validate_fixtures,
)


REQUIRED_TABLES = {
    "action_items",
    "chapters",
    "meeting_participants",
    "meetings",
    "participants",
    "summaries",
    "topics",
    "transcript_segments",
}


class SchemaNotReadyError(RuntimeError):
    """Raised when the configured database has not been migrated."""


@dataclass(frozen=True)
class SeedResult:
    created_meetings: int
    deleted_meetings: int = 0


def _ensure_schema_exists(session: Session) -> None:
    existing_tables = set(inspect(session.get_bind()).get_table_names())
    missing_tables = REQUIRED_TABLES - existing_tables
    if missing_tables:
        raise SchemaNotReadyError(
            "Database schema is not ready. Run `alembic upgrade head` before seeding. "
            f"Missing tables: {', '.join(sorted(missing_tables))}."
        )


def _delete_canonical_seed_data(session: Session) -> int:
    seeded_meetings = list(
        session.scalars(
            select(Meeting).where(
                Meeting.source_type == "seeded",
                Meeting.title.in_(CANONICAL_MEETING_TITLES),
            )
        )
    )
    meeting_ids = [meeting.id for meeting in seeded_meetings]
    participant_ids: set[int] = set()
    if meeting_ids:
        participant_ids.update(
            session.scalars(
                select(MeetingParticipant.participant_id).where(
                    MeetingParticipant.meeting_id.in_(meeting_ids)
                )
            )
        )

    for meeting in seeded_meetings:
        session.delete(meeting)
    session.flush()

    if participant_ids:
        # Shared people may also belong to user-created meetings, so cleanup is limited
        # to candidates detached by this reset and only after all references are gone.
        orphaned_participants = session.scalars(
            select(Participant).where(
                Participant.id.in_(participant_ids),
                ~Participant.meeting_links.any(),
                ~Participant.transcript_segments.any(),
                ~Participant.assigned_action_items.any(),
            )
        )
        for participant in orphaned_participants:
            # Seed construction may leave now-cascaded association rows in the
            # session identity map; expiring them avoids a redundant ORM delete.
            session.expire(
                participant,
                ["meeting_links", "transcript_segments", "assigned_action_items"],
            )
            session.delete(participant)
        session.flush()

    return len(seeded_meetings)


def _get_or_create_participants(session: Session) -> dict[str, Participant]:
    fixture_by_email = {fixture.email.lower(): fixture for fixture in PARTICIPANTS}
    stored_by_email = {
        participant.email.lower(): participant
        for participant in session.scalars(
            select(Participant).where(
                Participant.email.in_(fixture.email for fixture in PARTICIPANTS)
            )
        )
        if participant.email is not None
    }

    participants_by_key: dict[str, Participant] = {}
    for email, fixture in fixture_by_email.items():
        participant = stored_by_email.get(email)
        if participant is None:
            participant = Participant(name=fixture.name, email=fixture.email)
            session.add(participant)
        # Email identity allows one fictional person to be reused across meetings.
        participants_by_key[fixture.key] = participant
    return participants_by_key


def _build_meeting(fixture_index: int, participants: dict[str, Participant]) -> Meeting:
    fixture = MEETINGS[fixture_index]
    meeting = Meeting(
        title=fixture.title,
        meeting_date=fixture.meeting_date,
        duration_seconds=fixture.duration_seconds,
        source_type="seeded",
    )
    meeting.participant_links.extend(
        MeetingParticipant(
            participant=participants[participant_key],
            is_organizer=participant_key == fixture.organizer_key,
        )
        for participant_key in fixture.participant_keys
    )
    meeting.transcript_segments.extend(
        TranscriptSegment(
            speaker=participants[segment.speaker_key],
            sequence_index=segment.sequence_index,
            start_time_ms=segment.start_time_ms,
            end_time_ms=segment.end_time_ms,
            text=segment.text,
        )
        for segment in fixture.transcript
    )
    meeting.summary = Summary(
        overview=fixture.overview,
        short_summary=fixture.short_summary,
    )
    meeting.action_items.extend(
        ActionItem(
            assignee=participants[action.assignee_key],
            sequence_index=action.sequence_index,
            text=action.text,
            completed=action.completed,
            timestamp_ms=action.timestamp_ms,
        )
        for action in fixture.action_items
    )
    meeting.topics.extend(
        Topic(name=topic.name, sequence_index=topic.sequence_index)
        for topic in fixture.topics
    )
    meeting.chapters.extend(
        Chapter(
            title=chapter.title,
            summary=chapter.summary,
            start_time_ms=chapter.start_time_ms,
            end_time_ms=chapter.end_time_ms,
            sequence_index=chapter.sequence_index,
        )
        for chapter in fixture.chapters
    )
    return meeting


def seed_database(session: Session, *, reset: bool = False) -> SeedResult:
    validate_fixtures()
    _ensure_schema_exists(session)

    try:
        deleted_meetings = _delete_canonical_seed_data(session) if reset else 0
        existing_titles = set(
            session.scalars(
                select(Meeting.title).where(
                    Meeting.source_type == "seeded",
                    Meeting.title.in_(CANONICAL_MEETING_TITLES),
                )
            )
        )
        missing_indexes = [
            index
            for index, fixture in enumerate(MEETINGS)
            if fixture.title not in existing_titles
        ]

        # Existing canonical titles are skipped, making normal execution safe to repeat
        # while still allowing an interrupted, partially seeded database to be completed.
        if missing_indexes:
            participants = _get_or_create_participants(session)
            session.add_all(
                _build_meeting(index, participants) for index in missing_indexes
            )
        session.commit()
    except Exception:
        session.rollback()
        raise

    return SeedResult(
        created_meetings=len(missing_indexes),
        deleted_meetings=deleted_meetings,
    )


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed the configured FireFiles database with fictional meetings."
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Replace only the canonical seeded meetings before recreating them.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    try:
        with SessionLocal() as session:
            result = seed_database(session, reset=args.reset)
    except SchemaNotReadyError as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        return 1

    if args.reset:
        print(
            f"Reset seed data: removed {result.deleted_meetings} and created "
            f"{result.created_meetings} meetings."
        )
    elif result.created_meetings == 0:
        print("Seed data already exists; no meetings were added.")
    else:
        print(f"Seeded {result.created_meetings} fictional meetings.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
