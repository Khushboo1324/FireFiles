from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Literal

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import (
    ActionItem,
    Meeting,
    MeetingParticipant,
    Participant,
    TranscriptSegment,
)


MeetingSort = Literal["newest", "oldest"]
DateFilter = date | datetime


def _escaped_contains(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _apply_filters(
    statement: Select[tuple[Meeting]],
    *,
    search: str | None,
    participant_name: str | None,
    date_from: DateFilter | None,
    date_to: DateFilter | None,
) -> Select[tuple[Meeting]]:
    if search and (term := search.strip()):
        statement = statement.where(
            Meeting.title.ilike(_escaped_contains(term), escape="\\")
        )

    if participant_name and (name := participant_name.strip()):
        participant_matches = MeetingParticipant.participant.has(
            Participant.name.ilike(_escaped_contains(name), escape="\\")
        )
        # Relationship predicates compile to EXISTS, so a meeting appears once even
        # when more than one of its participants matches the supplied name.
        statement = statement.where(Meeting.participant_links.any(participant_matches))

    if date_from is not None:
        start = (
            date_from
            if isinstance(date_from, datetime)
            else datetime.combine(date_from, time.min)
        )
        statement = statement.where(Meeting.meeting_date >= start)

    if date_to is not None:
        if isinstance(date_to, datetime):
            statement = statement.where(Meeting.meeting_date <= date_to)
        else:
            # An exclusive next-midnight bound includes every meeting on date_to.
            end = datetime.combine(date_to + timedelta(days=1), time.min)
            statement = statement.where(Meeting.meeting_date < end)

    return statement


def list_meetings(
    session: Session,
    *,
    search: str | None = None,
    participant_name: str | None = None,
    date_from: DateFilter | None = None,
    date_to: DateFilter | None = None,
    sort: MeetingSort = "newest",
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Meeting], int]:
    if sort not in ("newest", "oldest"):
        raise ValueError("sort must be either 'newest' or 'oldest'")
    if limit < 0:
        raise ValueError("limit must be non-negative")
    if offset < 0:
        raise ValueError("offset must be non-negative")

    filtered = _apply_filters(
        select(Meeting),
        search=search,
        participant_name=participant_name,
        date_from=date_from,
        date_to=date_to,
    )

    # Count the filtered statement before pagination so callers can render accurate
    # page controls regardless of the current limit and offset.
    total = session.scalar(select(func.count()).select_from(filtered.subquery())) or 0

    order_columns = (
        Meeting.meeting_date.desc(),
        Meeting.id.desc(),
    ) if sort == "newest" else (
        Meeting.meeting_date.asc(),
        Meeting.id.asc(),
    )
    statement = (
        filtered.options(
            selectinload(Meeting.participant_links).selectinload(
                MeetingParticipant.participant
            ),
            joinedload(Meeting.summary),
        )
        .order_by(*order_columns)
        .limit(limit)
        .offset(offset)
    )
    return list(session.scalars(statement)), total


def get_meeting_detail(session: Session, meeting_id: int) -> Meeting | None:
    statement = (
        select(Meeting)
        .where(Meeting.id == meeting_id)
        .options(
            selectinload(Meeting.participant_links).selectinload(
                MeetingParticipant.participant
            ),
            joinedload(Meeting.summary),
            selectinload(Meeting.transcript_segments).selectinload(
                # Loading speakers in one batch keeps transcript rendering query-safe.
                TranscriptSegment.speaker
            ),
            selectinload(Meeting.action_items).selectinload(
                ActionItem.assignee
            ),
            selectinload(Meeting.topics),
            selectinload(Meeting.chapters),
        )
    )
    meeting = session.scalar(statement)
    if meeting is None:
        return None

    # The database enforces unique indexes, while explicit sorting makes response
    # order deterministic without changing the existing relationship definitions.
    meeting.transcript_segments.sort(key=lambda segment: segment.sequence_index)
    meeting.action_items.sort(key=lambda item: item.sequence_index)
    meeting.topics.sort(key=lambda topic: topic.sequence_index)
    meeting.chapters.sort(key=lambda chapter: chapter.sequence_index)
    return meeting
