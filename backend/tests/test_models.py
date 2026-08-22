from collections.abc import Generator
from datetime import datetime, timezone

import pytest
from sqlalchemy import Engine, func, inspect, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import create_db_engine
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


@pytest.fixture
def test_engine() -> Generator[Engine, None, None]:
    engine = create_db_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db(test_engine: Engine) -> Generator[Session, None, None]:
    factory = sessionmaker(bind=test_engine, class_=Session)
    with factory() as session:
        yield session


def meeting_factory(title: str = "Product planning") -> Meeting:
    return Meeting(
        title=title,
        meeting_date=datetime(2026, 8, 23, 9, 0, tzinfo=timezone.utc),
        duration_seconds=1_800,
        source_type="seeded",
    )


def test_all_model_tables_can_be_created(test_engine: Engine) -> None:
    assert set(inspect(test_engine).get_table_names()) == {
        "action_items",
        "chapters",
        "meeting_participants",
        "meetings",
        "participants",
        "summaries",
        "topics",
        "transcript_segments",
    }


def test_deleting_meeting_removes_owned_rows_but_not_participant(db: Session) -> None:
    participant = Participant(name="Avery Shah", email="avery@example.test")
    meeting = meeting_factory()
    meeting.participant_links.append(
        MeetingParticipant(participant=participant, is_organizer=True)
    )
    meeting.transcript_segments.append(
        TranscriptSegment(
            speaker=participant,
            sequence_index=0,
            start_time_ms=0,
            end_time_ms=2_000,
            text="Let's review the launch plan.",
        )
    )
    meeting.summary = Summary(overview="The team reviewed the launch plan.")
    meeting.action_items.append(
        ActionItem(
            assignee=participant,
            sequence_index=0,
            text="Draft the launch checklist.",
            timestamp_ms=500,
        )
    )
    meeting.topics.append(Topic(name="Launch", sequence_index=0))
    meeting.chapters.append(
        Chapter(title="Planning", start_time_ms=0, sequence_index=0)
    )
    db.add(meeting)
    db.commit()

    db.delete(meeting)
    db.commit()

    assert db.scalar(select(func.count()).select_from(MeetingParticipant)) == 0
    assert db.scalar(select(func.count()).select_from(TranscriptSegment)) == 0
    assert db.scalar(select(func.count()).select_from(Summary)) == 0
    assert db.scalar(select(func.count()).select_from(ActionItem)) == 0
    assert db.scalar(select(func.count()).select_from(Topic)) == 0
    assert db.scalar(select(func.count()).select_from(Chapter)) == 0
    assert db.scalar(select(func.count()).select_from(Participant)) == 1


def test_deleting_participant_nulls_speaker_and_assignee(db: Session) -> None:
    participant = Participant(name="Jordan Lee")
    meeting = meeting_factory()
    meeting.participant_links.append(MeetingParticipant(participant=participant))
    segment = TranscriptSegment(
        meeting=meeting,
        speaker=participant,
        sequence_index=0,
        start_time_ms=100,
        end_time_ms=500,
        text="I'll prepare the draft.",
    )
    action_item = ActionItem(
        meeting=meeting,
        assignee=participant,
        sequence_index=0,
        text="Prepare the draft.",
    )
    db.add_all([segment, action_item])
    db.commit()
    participant_id = participant.id
    segment_id = segment.id
    action_item_id = action_item.id
    db.expunge_all()

    stored_participant = db.get(Participant, participant_id)
    assert stored_participant is not None
    assert len(stored_participant.meeting_links) == 1
    db.delete(stored_participant)
    db.commit()

    assert db.get(TranscriptSegment, segment_id).speaker_id is None
    assert db.get(ActionItem, action_item_id).assignee_id is None
    assert db.scalar(select(func.count()).select_from(MeetingParticipant)) == 0
    assert db.scalar(select(func.count()).select_from(Meeting)) == 1


def test_duplicate_transcript_sequence_in_meeting_is_rejected(db: Session) -> None:
    meeting = meeting_factory()
    meeting.transcript_segments.extend(
        [
            TranscriptSegment(
                sequence_index=0,
                start_time_ms=0,
                end_time_ms=100,
                text="First segment.",
            ),
            TranscriptSegment(
                sequence_index=0,
                start_time_ms=100,
                end_time_ms=200,
                text="Duplicate sequence.",
            ),
        ]
    )
    db.add(meeting)

    with pytest.raises(IntegrityError):
        db.commit()


def test_sqlite_foreign_key_enforcement_is_active(test_engine: Engine) -> None:
    with test_engine.begin() as connection:
        assert connection.scalar(text("PRAGMA foreign_keys")) == 1

        with pytest.raises(IntegrityError):
            connection.execute(
                text(
                    "INSERT INTO meeting_participants "
                    "(meeting_id, participant_id) VALUES (999, 999)"
                )
            )


def test_participant_email_uniqueness_is_case_insensitive(db: Session) -> None:
    db.add_all(
        [
            Participant(name="Morgan One", email="Morgan@example.test"),
            Participant(name="Morgan Two", email="morgan@example.test"),
        ]
    )

    with pytest.raises(IntegrityError):
        db.commit()
