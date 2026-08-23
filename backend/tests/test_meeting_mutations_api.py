from collections.abc import Generator
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session, selectinload, sessionmaker

from app.db.base import Base
from app.db.session import create_db_engine, get_db
from app.main import app
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
from app.seed.seeder import seed_database


CREATE_PAYLOAD = {
    "title": "Customer discovery follow-up",
    "meeting_date": "2026-08-23T09:30:00Z",
    "duration_seconds": 1_500,
    "media_url": "https://media.example.test/discovery.mp3",
    "participants": [
        {
            "name": "Riley Chen",
            "email": "riley.chen@example.test",
            "avatar_url": None,
            "is_organizer": True,
        }
    ],
}


@pytest.fixture
def api_engine(tmp_path: Path) -> Generator[Engine, None, None]:
    database_path = tmp_path / "meeting-mutations-api-test.db"
    engine = create_db_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def client(api_engine: Engine) -> Generator[TestClient, None, None]:
    session_factory = sessionmaker(
        bind=api_engine,
        class_=Session,
        expire_on_commit=False,
    )
    with session_factory() as session:
        seed_database(session)

    def override_get_db() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _participant_payloads_except(
    session: Session, meeting_id: int, removed_participant_id: int
) -> list[dict[str, object]]:
    meeting = session.scalar(
        select(Meeting)
        .where(Meeting.id == meeting_id)
        .options(
            selectinload(Meeting.participant_links).selectinload(
                MeetingParticipant.participant
            )
        )
    )
    assert meeting is not None
    return [
        {
            "name": link.participant.name,
            "email": link.participant.email,
            "avatar_url": link.participant.avatar_url,
            "is_organizer": link.is_organizer,
        }
        for link in meeting.participant_links
        if link.participant_id != removed_participant_id
    ]


def test_create_meeting_returns_complete_empty_detail(client: TestClient) -> None:
    payload = {
        **CREATE_PAYLOAD,
        "title": "  Customer discovery follow-up  ",
        "participants": [
            {
                "name": "  Riley Chen  ",
                "email": "  ",
                "avatar_url": None,
                "is_organizer": True,
            }
        ],
    }

    response = client.post("/api/meetings", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Customer discovery follow-up"
    assert data["source_type"] == "pasted"
    assert data["participants"][0]["name"] == "Riley Chen"
    assert data["participants"][0]["email"] is None
    assert data["summary"] is None
    assert data["transcript_segments"] == []
    assert data["action_items"] == []
    assert data["topics"] == []
    assert data["chapters"] == []


def test_create_reuses_email_case_insensitively_without_rewriting_global_data(
    client: TestClient, api_engine: Engine
) -> None:
    with Session(api_engine) as session:
        existing = session.scalar(
            select(Participant).where(
                Participant.email == "amara.voss@example.com"
            )
        )
        assert existing is not None
        existing_id = existing.id
        existing_name = existing.name
        existing_avatar_url = existing.avatar_url
        participant_count_before = session.scalar(
            select(func.count()).select_from(Participant)
        )

    payload = {
        **CREATE_PAYLOAD,
        "participants": [
            {
                "name": "Payload-only display name",
                "email": "  AMARA.VOSS@EXAMPLE.COM  ",
                "avatar_url": "https://example.test/replacement.png",
            }
        ],
    }
    response = client.post("/api/meetings", json=payload)

    assert response.status_code == 201
    participant = response.json()["participants"][0]
    assert participant["id"] == existing_id
    assert participant["name"] == existing_name
    assert participant["avatar_url"] == existing_avatar_url
    with Session(api_engine) as session:
        assert (
            session.scalar(select(func.count()).select_from(Participant))
            == participant_count_before
        )


def test_create_same_name_without_email_creates_distinct_participants(
    client: TestClient,
) -> None:
    payload = {
        **CREATE_PAYLOAD,
        "participants": [
            {"name": "Alex Kim", "email": None},
            {"name": "Alex Kim", "email": None},
        ],
    }

    response = client.post("/api/meetings", json=payload)

    assert response.status_code == 201
    participants = response.json()["participants"]
    assert len(participants) == 2
    assert len({participant["id"] for participant in participants}) == 2


@pytest.mark.parametrize(
    "payload",
    [
        {
            **CREATE_PAYLOAD,
            "participants": [
                {"name": "One", "email": "duplicate@example.test"},
                {"name": "Two", "email": "DUPLICATE@example.test"},
            ],
        },
        {**CREATE_PAYLOAD, "title": "  "},
        {**CREATE_PAYLOAD, "duration_seconds": -1},
        {**CREATE_PAYLOAD, "participants": []},
        {**CREATE_PAYLOAD, "source_type": "upload"},
    ],
)
def test_create_rejects_invalid_write_payloads(
    client: TestClient, payload: dict[str, object]
) -> None:
    response = client.post("/api/meetings", json=payload)

    assert response.status_code == 422


def test_patch_updates_one_field_and_preserves_omitted_fields(
    client: TestClient,
) -> None:
    create_response = client.post("/api/meetings", json=CREATE_PAYLOAD)
    assert create_response.status_code == 201
    before = create_response.json()

    response = client.patch(
        f"/api/meetings/{before['id']}",
        json={"title": "  Updated discovery follow-up  "},
    )

    assert response.status_code == 200
    after = response.json()
    assert after["title"] == "Updated discovery follow-up"
    for field_name in (
        "meeting_date",
        "duration_seconds",
        "media_url",
        "source_type",
        "participants",
    ):
        assert after[field_name] == before[field_name]


def test_patch_explicit_media_null_is_applied(client: TestClient) -> None:
    created = client.post("/api/meetings", json=CREATE_PAYLOAD).json()

    response = client.patch(
        f"/api/meetings/{created['id']}", json={"media_url": None}
    )

    assert response.status_code == 200
    assert response.json()["media_url"] is None


def test_patch_participants_replaces_set_and_reuses_existing_email(
    client: TestClient, api_engine: Engine
) -> None:
    created = client.post("/api/meetings", json=CREATE_PAYLOAD).json()
    with Session(api_engine) as session:
        existing = session.scalar(
            select(Participant).where(
                Participant.email == "amara.voss@example.com"
            )
        )
        assert existing is not None
        existing_id = existing.id

    response = client.patch(
        f"/api/meetings/{created['id']}",
        json={
            "participants": [
                {
                    "name": "Ignored replacement name",
                    "email": "AMARA.VOSS@example.com",
                    "is_organizer": True,
                }
            ]
        },
    )

    assert response.status_code == 200
    participants = response.json()["participants"]
    assert [participant["id"] for participant in participants] == [existing_id]


@pytest.mark.parametrize("reference_type", ["speaker", "assignee"])
def test_patch_rejects_removing_referenced_participant(
    client: TestClient, api_engine: Engine, reference_type: str
) -> None:
    with Session(api_engine) as session:
        if reference_type == "speaker":
            reference = session.scalar(select(TranscriptSegment))
            assert reference is not None and reference.speaker_id is not None
            meeting_id = reference.meeting_id
            removed_participant_id = reference.speaker_id
        else:
            reference = session.scalar(
                select(ActionItem).where(ActionItem.assignee_id.is_not(None))
            )
            assert reference is not None and reference.assignee_id is not None
            meeting_id = reference.meeting_id
            removed_participant_id = reference.assignee_id
        participants = _participant_payloads_except(
            session, meeting_id, removed_participant_id
        )

    response = client.patch(
        f"/api/meetings/{meeting_id}", json={"participants": participants}
    )

    assert response.status_code == 409
    assert "Cannot remove participants" in response.json()["detail"]
    detail_response = client.get(f"/api/meetings/{meeting_id}")
    assert detail_response.status_code == 200
    assert removed_participant_id in {
        participant["id"] for participant in detail_response.json()["participants"]
    }


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "  "},
        {"title": None},
        {"duration_seconds": -1},
        {"participants": []},
        {"participants": None},
        {"source_type": "upload"},
    ],
)
def test_patch_rejects_invalid_write_payloads(
    client: TestClient, payload: dict[str, object]
) -> None:
    response = client.patch("/api/meetings/1", json=payload)

    assert response.status_code == 422


def test_patch_missing_and_invalid_ids(client: TestClient) -> None:
    missing_response = client.patch(
        "/api/meetings/999999", json={"title": "New"}
    )

    assert missing_response.status_code == 404
    assert client.patch("/api/meetings/0", json={"title": "New"}).status_code == 422


def test_delete_cascades_owned_rows_but_preserves_shared_participant(
    client: TestClient, api_engine: Engine
) -> None:
    with Session(api_engine) as session:
        shared_participant = session.scalar(select(Participant).limit(1))
        assert shared_participant is not None
        shared_participant_id = shared_participant.id
        shared_meeting_count_before = session.scalar(
            select(func.count())
            .select_from(MeetingParticipant)
            .where(MeetingParticipant.participant_id == shared_participant_id)
        )
        meeting = Meeting(
            title="Meeting to delete",
            meeting_date=datetime(2026, 8, 23, 12, 0, tzinfo=timezone.utc),
            duration_seconds=300,
            source_type="pasted",
        )
        meeting.participant_links.append(
            MeetingParticipant(participant=shared_participant, is_organizer=True)
        )
        meeting.summary = Summary(overview="Temporary summary")
        meeting.transcript_segments.append(
            TranscriptSegment(
                speaker=shared_participant,
                sequence_index=0,
                start_time_ms=0,
                end_time_ms=100,
                text="Temporary transcript",
            )
        )
        meeting.action_items.append(
            ActionItem(
                assignee=shared_participant,
                sequence_index=0,
                text="Temporary action",
            )
        )
        meeting.topics.append(Topic(name="Temporary topic", sequence_index=0))
        meeting.chapters.append(
            Chapter(title="Temporary chapter", start_time_ms=0, sequence_index=0)
        )
        session.add(meeting)
        session.commit()
        meeting_id = meeting.id

    response = client.delete(f"/api/meetings/{meeting_id}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/api/meetings/{meeting_id}").status_code == 404
    with Session(api_engine) as session:
        assert session.get(Participant, shared_participant_id) is not None
        shared_meeting_count_after = session.scalar(
            select(func.count())
            .select_from(MeetingParticipant)
            .where(MeetingParticipant.participant_id == shared_participant_id)
        )
        assert shared_meeting_count_after == shared_meeting_count_before
        for model in (
            MeetingParticipant,
            TranscriptSegment,
            Summary,
            ActionItem,
            Topic,
            Chapter,
        ):
            assert (
                session.scalar(
                    select(func.count())
                    .select_from(model)
                    .where(model.meeting_id == meeting_id)
                )
                == 0
            )


def test_delete_missing_meeting_returns_404(client: TestClient) -> None:
    response = client.delete("/api/meetings/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Meeting not found"}
