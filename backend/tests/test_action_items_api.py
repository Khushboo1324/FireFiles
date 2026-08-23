from collections.abc import Generator
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import create_db_engine, get_db
from app.main import app
from app.models import ActionItem, Meeting, MeetingParticipant, Participant


@pytest.fixture
def api_engine(tmp_path: Path) -> Generator[Engine, None, None]:
    database_path = tmp_path / "action-items-api-test.db"
    engine = create_db_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def records(api_engine: Engine) -> dict[str, int]:
    with Session(api_engine) as session:
        primary = Participant(name="Primary Assignee")
        replacement = Participant(name="Replacement Assignee")
        outsider = Participant(name="Outside Participant")
        meeting = Meeting(
            title="Action planning",
            meeting_date=datetime(2026, 8, 23, 9, 0, tzinfo=timezone.utc),
            duration_seconds=900,
            source_type="pasted",
            participant_links=[
                MeetingParticipant(participant=primary, is_organizer=True),
                MeetingParticipant(participant=replacement),
            ],
            action_items=[
                ActionItem(sequence_index=0, text="Existing first item"),
                ActionItem(sequence_index=2, text="Existing later item"),
            ],
        )
        empty_meeting = Meeting(
            title="Empty action list",
            meeting_date=datetime(2026, 8, 23, 10, 0, tzinfo=timezone.utc),
            duration_seconds=300,
            source_type="pasted",
            participant_links=[MeetingParticipant(participant=primary)],
        )
        other_meeting = Meeting(
            title="Other meeting",
            meeting_date=datetime(2026, 8, 23, 11, 0, tzinfo=timezone.utc),
            duration_seconds=300,
            source_type="pasted",
            participant_links=[MeetingParticipant(participant=outsider)],
        )
        session.add_all([meeting, empty_meeting, other_meeting])
        session.commit()
        return {
            "meeting_id": meeting.id,
            "empty_meeting_id": empty_meeting.id,
            "primary_id": primary.id,
            "replacement_id": replacement.id,
            "outsider_id": outsider.id,
        }


@pytest.fixture
def client(
    api_engine: Engine, records: dict[str, int]
) -> Generator[TestClient, None, None]:
    del records
    session_factory = sessionmaker(
        bind=api_engine,
        class_=Session,
        expire_on_commit=False,
    )

    def override_get_db() -> Generator[Session, None, None]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_post_creates_completed_item_with_next_sequence_and_assignee(
    client: TestClient, records: dict[str, int]
) -> None:
    response = client.post(
        f"/api/meetings/{records['meeting_id']}/action-items",
        json={
            "text": "  Send the follow-up  ",
            "assignee_id": records["primary_id"],
            "timestamp_ms": 1_250,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["text"] == "Send the follow-up"
    assert data["completed"] is False
    assert data["sequence_index"] == 3
    assert data["timestamp_ms"] == 1_250
    assert data["assignee"]["id"] == records["primary_id"]

    detail = client.get(f"/api/meetings/{records['meeting_id']}")
    assert detail.status_code == 200
    assert detail.json()["action_items"][-1] == data


def test_post_uses_zero_for_meeting_without_action_items(
    client: TestClient, records: dict[str, int]
) -> None:
    response = client.post(
        f"/api/meetings/{records['empty_meeting_id']}/action-items",
        json={"text": "First action"},
    )

    assert response.status_code == 201
    assert response.json()["sequence_index"] == 0


def test_post_rejects_assignee_outside_meeting_and_missing_participant(
    client: TestClient, records: dict[str, int]
) -> None:
    for assignee_id in (records["outsider_id"], 999_999):
        response = client.post(
            f"/api/meetings/{records['meeting_id']}/action-items",
            json={"text": "Invalid assignment", "assignee_id": assignee_id},
        )

        assert response.status_code == 409
        assert response.json() == {
            "detail": "Assignee must be a participant in this meeting"
        }


def test_post_missing_meeting_and_invalid_input(
    client: TestClient, records: dict[str, int]
) -> None:
    assert (
        client.post(
            "/api/meetings/999999/action-items", json={"text": "Missing"}
        ).status_code
        == 404
    )
    for meeting_id in ("0", "-1", "abc"):
        assert (
            client.post(
                f"/api/meetings/{meeting_id}/action-items",
                json={"text": "Invalid path"},
            ).status_code
            == 422
        )
    for payload in (
        {"text": "  "},
        {"text": "Negative timestamp", "timestamp_ms": -1},
        {"text": "Client-owned completion", "completed": True},
        {"text": "Client-owned sequence", "sequence_index": 4},
    ):
        assert (
            client.post(
                f"/api/meetings/{records['meeting_id']}/action-items",
                json=payload,
            ).status_code
            == 422
        )


def test_patch_supports_edit_complete_reopen_replace_and_nullable_clears(
    client: TestClient, records: dict[str, int]
) -> None:
    created = client.post(
        f"/api/meetings/{records['meeting_id']}/action-items",
        json={
            "text": "Original",
            "assignee_id": records["primary_id"],
            "timestamp_ms": 100,
        },
    ).json()
    action_item_id = created["id"]
    sequence_index = created["sequence_index"]

    edited = client.patch(
        f"/api/action-items/{action_item_id}", json={"text": "  Edited  "}
    )
    assert edited.status_code == 200
    assert edited.json()["text"] == "Edited"
    assert edited.json()["assignee"]["id"] == records["primary_id"]
    assert edited.json()["timestamp_ms"] == 100

    completed = client.patch(
        f"/api/action-items/{action_item_id}", json={"completed": True}
    )
    assert completed.status_code == 200
    assert completed.json()["completed"] is True

    reopened = client.patch(
        f"/api/action-items/{action_item_id}", json={"completed": False}
    )
    assert reopened.status_code == 200
    assert reopened.json()["completed"] is False

    reassigned = client.patch(
        f"/api/action-items/{action_item_id}",
        json={"assignee_id": records["replacement_id"], "timestamp_ms": 500},
    )
    assert reassigned.status_code == 200
    assert reassigned.json()["assignee"]["id"] == records["replacement_id"]
    assert reassigned.json()["timestamp_ms"] == 500

    cleared = client.patch(
        f"/api/action-items/{action_item_id}",
        json={"assignee_id": None, "timestamp_ms": None},
    )
    assert cleared.status_code == 200
    assert cleared.json()["assignee"] is None
    assert cleared.json()["timestamp_ms"] is None
    assert cleared.json()["text"] == "Edited"
    assert cleared.json()["completed"] is False
    assert cleared.json()["sequence_index"] == sequence_index

    unchanged = client.patch(f"/api/action-items/{action_item_id}", json={})
    assert unchanged.status_code == 200
    assert unchanged.json() == cleared.json()


def test_patch_rejects_invalid_assignment_payload_and_ids(
    client: TestClient, records: dict[str, int]
) -> None:
    created = client.post(
        f"/api/meetings/{records['meeting_id']}/action-items",
        json={"text": "Keep valid"},
    ).json()
    path = f"/api/action-items/{created['id']}"

    conflict = client.patch(path, json={"assignee_id": records["outsider_id"]})
    assert conflict.status_code == 409
    assert client.patch(path, json={"assignee_id": 999_999}).status_code == 409

    for payload in (
        {"text": " "},
        {"text": None},
        {"completed": None},
        {"timestamp_ms": -1},
        {"sequence_index": 99},
        {"meeting_id": records["empty_meeting_id"]},
    ):
        assert client.patch(path, json=payload).status_code == 422

    assert (
        client.patch("/api/action-items/999999", json={"text": "Missing"}).status_code
        == 404
    )
    for action_item_id in ("0", "-1", "abc"):
        assert (
            client.patch(
                f"/api/action-items/{action_item_id}", json={"text": "Invalid"}
            ).status_code
            == 422
        )


def test_delete_removes_only_item_without_participant_or_renumbering(
    client: TestClient, api_engine: Engine, records: dict[str, int]
) -> None:
    first_detail = client.get(f"/api/meetings/{records['meeting_id']}").json()
    item_to_delete = first_detail["action_items"][0]
    with Session(api_engine) as session:
        stored = session.get(ActionItem, item_to_delete["id"])
        assert stored is not None
        stored.assignee_id = records["primary_id"]
        session.commit()

    response = client.delete(f"/api/action-items/{item_to_delete['id']}")

    assert response.status_code == 204
    assert response.content == b""
    detail = client.get(f"/api/meetings/{records['meeting_id']}")
    assert detail.status_code == 200
    remaining = detail.json()["action_items"]
    assert [item["sequence_index"] for item in remaining] == [2]
    assert item_to_delete["id"] not in {item["id"] for item in remaining}
    with Session(api_engine) as session:
        assert session.get(Participant, records["primary_id"]) is not None
        assert session.get(ActionItem, item_to_delete["id"]) is None

    missing = client.delete(f"/api/action-items/{item_to_delete['id']}")
    assert missing.status_code == 404
    assert missing.json() == {"detail": "Action item not found"}


def test_existing_read_and_health_endpoints_still_work(
    client: TestClient, records: dict[str, int]
) -> None:
    list_response = client.get("/api/meetings")
    detail_response = client.get(f"/api/meetings/{records['meeting_id']}")
    health_response = client.get("/health")

    assert list_response.status_code == 200
    assert list_response.json()["total"] == 3
    assert detail_response.status_code == 200
    assert detail_response.json()["action_items"]
    assert health_response.status_code == 200
    assert health_response.json() == {"status": "ok"}
