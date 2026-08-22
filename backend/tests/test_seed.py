from collections.abc import Generator
from datetime import datetime, timezone
from pathlib import Path

import pytest
from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import create_db_engine
from app.models import Meeting, MeetingParticipant, Participant
from app.seed.fixtures import CANONICAL_MEETING_TITLES, MEETINGS, PARTICIPANTS
from app.seed.seeder import SchemaNotReadyError, seed_database


@pytest.fixture
def test_engine(tmp_path: Path) -> Generator[Engine, None, None]:
    database_path = tmp_path / "seed-test.db"
    engine = create_db_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(test_engine: Engine) -> Generator[Session, None, None]:
    factory = sessionmaker(bind=test_engine, class_=Session, expire_on_commit=False)
    with factory() as session:
        yield session


def test_seed_creates_complete_and_consistent_meetings(db: Session) -> None:
    result = seed_database(db)

    assert result.created_meetings == 6
    meetings = list(
        db.scalars(
            select(Meeting)
            .where(Meeting.source_type == "seeded")
            .order_by(Meeting.id)
        )
    )
    assert len(meetings) == 6
    assert {meeting.title for meeting in meetings} == CANONICAL_MEETING_TITLES
    assert db.scalar(select(func.count()).select_from(Participant)) == len(PARTICIPANTS)

    for meeting in meetings:
        participant_ids = {
            link.participant_id for link in meeting.participant_links
        }
        assert 3 <= len(participant_ids) <= 5
        assert sum(link.is_organizer for link in meeting.participant_links) == 1
        assert meeting.summary is not None
        assert meeting.summary.overview.strip()
        assert meeting.summary.short_summary
        assert meeting.transcript_segments
        assert meeting.action_items
        assert meeting.topics
        assert meeting.chapters
        assert all(
            segment.speaker_id in participant_ids
            for segment in meeting.transcript_segments
        )
        assert all(
            action.assignee_id in participant_ids for action in meeting.action_items
        )


def test_seed_is_idempotent(db: Session) -> None:
    first_result = seed_database(db)
    second_result = seed_database(db)

    assert first_result.created_meetings == 6
    assert second_result.created_meetings == 0
    assert db.scalar(select(func.count()).select_from(Meeting)) == 6
    assert db.scalar(select(func.count()).select_from(Participant)) == 8


def test_reset_preserves_unrelated_meetings_and_shared_participants(db: Session) -> None:
    seed_database(db)
    shared_participant = db.scalar(
        select(Participant).where(Participant.email == "amara.voss@example.com")
    )
    assert shared_participant is not None
    unrelated_meeting = Meeting(
        title="User-created retrospective",
        meeting_date=datetime(2026, 8, 22, 8, 0, tzinfo=timezone.utc),
        duration_seconds=900,
        source_type="pasted",
    )
    unrelated_meeting.participant_links.append(
        MeetingParticipant(participant=shared_participant, is_organizer=True)
    )
    db.add(unrelated_meeting)
    db.commit()
    unrelated_id = unrelated_meeting.id
    shared_id = shared_participant.id

    result = seed_database(db, reset=True)

    assert result.deleted_meetings == len(MEETINGS)
    assert result.created_meetings == len(MEETINGS)
    assert db.get(Meeting, unrelated_id) is not None
    assert db.get(Participant, shared_id) is not None
    assert (
        db.scalar(
            select(func.count())
            .select_from(Meeting)
            .where(Meeting.source_type == "seeded")
        )
        == 6
    )


def test_seed_requires_migrated_schema(tmp_path: Path) -> None:
    database_path = tmp_path / "unmigrated.db"
    engine = create_db_engine(f"sqlite:///{database_path}")
    factory = sessionmaker(bind=engine, class_=Session)

    try:
        with factory() as session, pytest.raises(
            SchemaNotReadyError, match="alembic upgrade head"
        ):
            seed_database(session)
    finally:
        engine.dispose()
