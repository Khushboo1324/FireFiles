from collections.abc import Generator
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import create_db_engine, get_db
from app.main import app
from app.seed.fixtures import MEETINGS
from app.seed.seeder import seed_database


@pytest.fixture
def api_engine(tmp_path: Path) -> Generator[Engine, None, None]:
    database_path = tmp_path / "meetings-api-test.db"
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


def meeting_dates(response_data: dict[str, object]) -> list[datetime]:
    items = response_data["items"]
    assert isinstance(items, list)
    return [datetime.fromisoformat(item["meeting_date"]) for item in items]


def test_list_meetings_returns_seeded_response(client: TestClient) -> None:
    response = client.get("/api/meetings")

    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"items", "total"}
    assert data["total"] == len(MEETINGS)
    assert len(data["items"]) == len(MEETINGS)


def test_default_order_is_newest_first(client: TestClient) -> None:
    response = client.get("/api/meetings")

    assert response.status_code == 200
    dates = meeting_dates(response.json())
    assert dates == sorted(dates, reverse=True)


@pytest.mark.parametrize("search", ["Product Weekly", "pRoDuCt WeEkLy"])
def test_search_is_case_insensitive(client: TestClient, search: str) -> None:
    response = client.get("/api/meetings", params={"search": search})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert [item["title"] for item in data["items"]] == ["Product Weekly Sync"]


def test_participant_filtering(client: TestClient) -> None:
    response = client.get("/api/meetings", params={"participant": "oWeN"})

    assert response.status_code == 200
    data = response.json()
    expected_total = sum("owen" in meeting.participant_keys for meeting in MEETINGS)
    assert data["total"] == expected_total
    assert all(
        any("owen" in participant["name"].lower() for participant in item["participants"])
        for item in data["items"]
    )


def test_date_from_is_inclusive(client: TestClient) -> None:
    response = client.get("/api/meetings", params={"date_from": "2026-08-20"})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert all(value.date().isoformat() >= "2026-08-20" for value in meeting_dates(data))


def test_date_to_is_inclusive(client: TestClient) -> None:
    response = client.get("/api/meetings", params={"date_to": "2026-08-19"})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert all(value.date().isoformat() <= "2026-08-19" for value in meeting_dates(data))


def test_oldest_sort(client: TestClient) -> None:
    response = client.get("/api/meetings", params={"sort": "oldest"})

    assert response.status_code == 200
    dates = meeting_dates(response.json())
    assert dates == sorted(dates)


def test_limit_preserves_filtered_total(client: TestClient) -> None:
    response = client.get(
        "/api/meetings",
        params={"participant": "Amara", "limit": 2},
    )

    assert response.status_code == 200
    data = response.json()
    expected_total = sum("amara" in meeting.participant_keys for meeting in MEETINGS)
    assert len(data["items"]) == 2
    assert data["total"] == expected_total


def test_offset_skips_results(client: TestClient) -> None:
    all_response = client.get("/api/meetings")
    offset_response = client.get("/api/meetings", params={"offset": 1})

    assert all_response.status_code == 200
    assert offset_response.status_code == 200
    assert offset_response.json()["items"] == all_response.json()["items"][1:]
    assert offset_response.json()["total"] == len(MEETINGS)


def test_combined_filters(client: TestClient) -> None:
    response = client.get(
        "/api/meetings",
        params={
            "search": "e",
            "participant": "Amara",
            "date_from": "2026-08-20",
            "date_to": "2026-08-21",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert {item["title"] for item in data["items"]} == {
        "Customer Onboarding Review",
        "Design Critique — Meeting Workspace",
    }


@pytest.mark.parametrize(
    ("params", "expected_error_fragment"),
    [
        ({"sort": "random"}, "Input should be 'newest' or 'oldest'"),
        ({"limit": 0}, "greater than or equal to 1"),
        ({"limit": 101}, "less than or equal to 100"),
        ({"offset": -1}, "greater than or equal to 0"),
        ({"date_from": "not-a-date"}, "valid date or datetime"),
        (
            {"date_from": "2026-08-31", "date_to": "2026-08-01"},
            "date_from must be on or before date_to",
        ),
    ],
)
def test_invalid_query_parameters_return_422(
    client: TestClient,
    params: dict[str, object],
    expected_error_fragment: str,
) -> None:
    response = client.get("/api/meetings", params=params)

    assert response.status_code == 422
    assert expected_error_fragment in response.text


@pytest.mark.parametrize(
    ("parameter", "value"),
    [("search", "   "), ("participant", " \t ")],
)
def test_blank_text_filter_behaves_as_no_filter(
    client: TestClient,
    parameter: str,
    value: str,
) -> None:
    response = client.get("/api/meetings", params={parameter: value})

    assert response.status_code == 200
    assert response.json()["total"] == len(MEETINGS)


def test_health_endpoint_still_works(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
