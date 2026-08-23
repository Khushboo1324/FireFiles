from collections.abc import Generator
from datetime import datetime, timezone
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.routes.meetings import MAX_TRANSCRIPT_UPLOAD_BYTES
from app.db.base import Base
from app.db.session import create_db_engine, get_db
from app.main import app
from app.models import (
    ActionItem,
    Meeting,
    MeetingParticipant,
    Participant,
    Summary,
    TranscriptSegment,
)


@pytest.fixture
def api_engine(tmp_path: Path) -> Generator[Engine, None, None]:
    engine = create_db_engine(f"sqlite:///{tmp_path / 'transcript-import-api.db'}")
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def records(api_engine: Engine) -> dict[str, int]:
    with Session(api_engine) as session:
        amara = Participant(name="Amara Voss", email="amara@meeting.test")
        unrelated_dev = Participant(name="Dev Malik", email="dev@elsewhere.test")
        import_meeting = Meeting(
            title="Transcript import target",
            meeting_date=datetime(2026, 8, 23, 10, 0, tzinfo=timezone.utc),
            duration_seconds=300,
            source_type="pasted",
            participant_links=[
                MeetingParticipant(participant=amara, is_organizer=True)
            ],
        )
        occupied_meeting = Meeting(
            title="Existing transcript",
            meeting_date=datetime(2026, 8, 23, 11, 0, tzinfo=timezone.utc),
            duration_seconds=300,
            source_type="pasted",
            participant_links=[
                MeetingParticipant(participant=amara, is_organizer=True)
            ],
            transcript_segments=[
                TranscriptSegment(
                    speaker=amara,
                    sequence_index=0,
                    start_time_ms=0,
                    end_time_ms=300_000,
                    text="Original transcript",
                )
            ],
            summary=Summary(overview="Preserve this summary"),
            action_items=[ActionItem(sequence_index=0, text="Preserve this action")],
        )
        session.add_all([import_meeting, occupied_meeting, unrelated_dev])
        session.commit()
        return {
            "import_meeting_id": import_meeting.id,
            "occupied_meeting_id": occupied_meeting.id,
            "amara_id": amara.id,
            "unrelated_dev_id": unrelated_dev.id,
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


def test_paste_import_persists_order_and_resolves_meeting_local_speakers(
    client: TestClient,
    api_engine: Engine,
    records: dict[str, int],
) -> None:
    response = client.post(
        f"/api/meetings/{records['import_meeting_id']}/transcript/paste",
        json={
            "content": (
                "[00:00] amara voss: Welcome.\n"
                "[00:10] Dev Malik: First update.\n"
                "[00:20] dev malik: Second update."
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert [item["sequence_index"] for item in data["transcript_segments"]] == [
        0,
        1,
        2,
    ]
    assert [item["end_time_ms"] for item in data["transcript_segments"]] == [
        10_000,
        20_000,
        300_000,
    ]
    speakers = [item["speaker"] for item in data["transcript_segments"]]
    assert speakers[0]["id"] == records["amara_id"]
    assert speakers[1]["id"] == speakers[2]["id"]
    assert speakers[1]["id"] != records["unrelated_dev_id"]
    new_participant = next(
        participant
        for participant in data["participants"]
        if participant["id"] == speakers[1]["id"]
    )
    assert new_participant == {
        "id": speakers[1]["id"],
        "name": "Dev Malik",
        "avatar_url": None,
        "email": None,
    }
    with Session(api_engine) as session:
        link_count = session.scalar(
            select(func.count())
            .select_from(MeetingParticipant)
            .where(
                MeetingParticipant.meeting_id == records["import_meeting_id"],
                MeetingParticipant.participant_id == speakers[1]["id"],
            )
        )
        assert link_count == 1


def test_existing_transcript_conflict_and_atomic_replacement(
    client: TestClient, records: dict[str, int]
) -> None:
    path = f"/api/meetings/{records['occupied_meeting_id']}/transcript/paste"

    conflict = client.post(path, json={"content": "[00:00] Amara Voss: New"})
    assert conflict.status_code == 409
    assert conflict.json() == {"detail": "Meeting already has a transcript"}

    invalid_replacement = client.post(
        path,
        json={"content": "malformed", "replace_existing": True},
    )
    assert invalid_replacement.status_code == 422
    after_invalid = client.get(
        f"/api/meetings/{records['occupied_meeting_id']}"
    ).json()
    assert [item["text"] for item in after_invalid["transcript_segments"]] == [
        "Original transcript"
    ]

    replacement = client.post(
        path,
        json={
            "content": (
                "[00:00] Amara Voss: Replacement one.\n"
                "[00:15] Amara Voss: Replacement two."
            ),
            "replace_existing": True,
        },
    )
    assert replacement.status_code == 200
    replaced = replacement.json()
    assert [item["text"] for item in replaced["transcript_segments"]] == [
        "Replacement one.",
        "Replacement two.",
    ]
    assert replaced["summary"]["overview"] == "Preserve this summary"
    assert [item["text"] for item in replaced["action_items"]] == [
        "Preserve this action"
    ]


def test_paste_rejects_missing_invalid_and_malformed_requests(
    client: TestClient, records: dict[str, int]
) -> None:
    valid_body = {"content": "[00:00] Speaker: Hello"}
    assert client.post("/api/meetings/999999/transcript/paste", json=valid_body).status_code == 404
    for meeting_id in ("0", "-1", "abc"):
        assert client.post(f"/api/meetings/{meeting_id}/transcript/paste", json=valid_body).status_code == 422
    assert client.post(
        f"/api/meetings/{records['import_meeting_id']}/transcript/paste",
        json={"content": "   "},
    ).status_code == 422


def test_txt_and_json_uploads_work_and_honor_replace(
    client: TestClient, records: dict[str, int]
) -> None:
    meeting_id = records["import_meeting_id"]
    txt_response = client.post(
        f"/api/meetings/{meeting_id}/transcript/upload",
        files={"file": ("notes.txt", b"[00:00] Amara Voss: TXT import", "text/plain")},
    )
    assert txt_response.status_code == 200
    assert txt_response.json()["transcript_segments"][0]["text"] == "TXT import"

    json_content = json.dumps(
        [
            {
                "speaker": "Amara Voss",
                "start_time_ms": 0,
                "end_time_ms": 25_000,
                "text": "JSON replacement",
            }
        ]
    )
    conflict = client.post(
        f"/api/meetings/{meeting_id}/transcript/upload",
        files={"file": ("notes.json", json_content, "application/json")},
    )
    assert conflict.status_code == 409

    replacement = client.post(
        f"/api/meetings/{meeting_id}/transcript/upload",
        files={"file": ("notes.json", json_content, "application/json")},
        data={"replace_existing": "true"},
    )
    assert replacement.status_code == 200
    assert [
        item["text"] for item in replacement.json()["transcript_segments"]
    ] == ["JSON replacement"]


def test_vtt_upload_works(client: TestClient, records: dict[str, int]) -> None:
    content = b"""WEBVTT

00:00:00.000 --> 00:00:05.000
Amara Voss: VTT import
"""
    response = client.post(
        f"/api/meetings/{records['import_meeting_id']}/transcript/upload",
        files={"file": ("notes.vtt", content, "text/vtt")},
    )

    assert response.status_code == 200
    assert response.json()["transcript_segments"][0]["end_time_ms"] == 5_000


@pytest.mark.parametrize(
    ("filename", "content_type"),
    [("notes.csv", "text/csv"), ("notes.json", "text/plain")],
)
def test_upload_rejects_unsupported_extension_or_content_type(
    client: TestClient,
    records: dict[str, int],
    filename: str,
    content_type: str,
) -> None:
    response = client.post(
        f"/api/meetings/{records['import_meeting_id']}/transcript/upload",
        files={"file": (filename, b"[]", content_type)},
    )

    assert response.status_code == 415


def test_upload_rejects_non_utf8_and_oversized_files(
    client: TestClient, records: dict[str, int]
) -> None:
    path = f"/api/meetings/{records['import_meeting_id']}/transcript/upload"
    non_utf8 = client.post(
        path,
        files={"file": ("notes.txt", b"\xff\xfe", "text/plain")},
    )
    assert non_utf8.status_code == 422
    assert "UTF-8" in non_utf8.json()["detail"]

    oversized = client.post(
        path,
        files={
            "file": (
                "notes.txt",
                b"x" * (MAX_TRANSCRIPT_UPLOAD_BYTES + 1),
                "text/plain",
            )
        },
    )
    assert oversized.status_code == 413
