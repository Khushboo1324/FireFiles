from collections.abc import Generator
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import create_db_engine
from app.models import Meeting
from app.schemas import MeetingDetailResponse, MeetingListResponse
from app.seed.fixtures import MEETINGS
from app.seed.seeder import seed_database
from app.services.meeting_service import get_meeting_detail, list_meetings


@pytest.fixture
def test_engine(tmp_path: Path) -> Generator[Engine, None, None]:
    database_path = tmp_path / "meeting-service-test.db"
    engine = create_db_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(test_engine: Engine) -> Generator[Session, None, None]:
    factory = sessionmaker(bind=test_engine, class_=Session, expire_on_commit=False)
    with factory() as session:
        seed_database(session)
        yield session


def test_list_returns_seeded_meetings_newest_first(db: Session) -> None:
    meetings, total = list_meetings(db)

    assert total == len(MEETINGS)
    assert [meeting.meeting_date for meeting in meetings] == sorted(
        (fixture.meeting_date for fixture in MEETINGS), reverse=True
    )
    response = MeetingListResponse(items=meetings, total=total)
    assert len(response.items) == len(MEETINGS)
    assert response.items[0].participants
    assert response.items[0].short_summary
    assert not hasattr(response.items[0], "transcript_segments")


def test_oldest_sorting_reverses_default_order(db: Session) -> None:
    meetings, _ = list_meetings(db, sort="oldest")

    assert [meeting.meeting_date for meeting in meetings] == sorted(
        fixture.meeting_date for fixture in MEETINGS
    )


def test_title_search_is_case_insensitive(db: Session) -> None:
    meetings, total = list_meetings(db, search="pRoDuCt WeEkLy")

    assert total == 1
    assert [meeting.title for meeting in meetings] == ["Product Weekly Sync"]


def test_participant_name_filter_uses_partial_case_insensitive_match(
    db: Session,
) -> None:
    meetings, total = list_meetings(db, participant_name="aMaRa")

    expected = [
        fixture
        for fixture in MEETINGS
        if "amara" in fixture.participant_keys
    ]
    assert total == len(expected)
    assert len(meetings) == len(expected)
    assert len({meeting.id for meeting in meetings}) == len(meetings)


def test_date_filters_are_inclusive(db: Session) -> None:
    from_meetings, from_total = list_meetings(db, date_from=date(2026, 8, 20))
    to_meetings, to_total = list_meetings(db, date_to=date(2026, 8, 19))

    assert from_total == 3
    assert all(
        meeting.meeting_date.date() >= date(2026, 8, 20)
        for meeting in from_meetings
    )
    assert to_total == 3
    assert all(
        meeting.meeting_date.date() <= date(2026, 8, 19)
        for meeting in to_meetings
    )


def test_combined_filters_apply_together(db: Session) -> None:
    meetings, total = list_meetings(
        db,
        search="e",
        participant_name="Amara",
        date_from=date(2026, 8, 20),
        date_to=date(2026, 8, 21),
    )

    assert total == 2
    assert {meeting.title for meeting in meetings} == {
        "Customer Onboarding Review",
        "Design Critique — Meeting Workspace",
    }


def test_limit_offset_and_total_are_independent(db: Session) -> None:
    all_meetings, _ = list_meetings(db)
    meetings, total = list_meetings(db, limit=2, offset=1)

    assert total == len(MEETINGS)
    assert [meeting.id for meeting in meetings] == [
        meeting.id for meeting in all_meetings[1:3]
    ]


def test_detail_contains_nested_data_in_sequence_order(db: Session) -> None:
    meetings, _ = list_meetings(db, sort="oldest", limit=1)
    detail = get_meeting_detail(db, meetings[0].id)

    assert detail is not None
    response = MeetingDetailResponse.model_validate(detail)
    assert response.participants
    assert response.participants[0].email
    assert response.summary is not None
    assert response.summary.overview
    assert response.transcript_segments
    assert [item.sequence_index for item in response.transcript_segments] == sorted(
        item.sequence_index for item in response.transcript_segments
    )
    assert all(segment.speaker is not None for segment in response.transcript_segments)
    assert response.action_items
    assert all(item.assignee is not None for item in response.action_items)
    assert [item.sequence_index for item in response.action_items] == sorted(
        item.sequence_index for item in response.action_items
    )
    assert response.topics
    assert [item.sequence_index for item in response.topics] == sorted(
        item.sequence_index for item in response.topics
    )
    assert response.chapters
    assert [item.sequence_index for item in response.chapters] == sorted(
        item.sequence_index for item in response.chapters
    )


def test_missing_meeting_returns_none(db: Session) -> None:
    assert get_meeting_detail(db, 999_999) is None


def test_meeting_without_summary_is_safe(db: Session) -> None:
    meeting = Meeting(
        title="Summary pending",
        meeting_date=MEETINGS[0].meeting_date,
        duration_seconds=60,
        media_url=None,
        source_type="pasted",
    )
    db.add(meeting)
    db.commit()

    list_items, _ = list_meetings(db, search="Summary pending")
    list_response = MeetingListResponse(items=list_items, total=1)
    detail = get_meeting_detail(db, meeting.id)

    assert list_response.items[0].short_summary is None
    assert detail is not None
    assert MeetingDetailResponse.model_validate(detail).summary is None
