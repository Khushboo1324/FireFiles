from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.action_item import ActionItem
    from app.models.chapter import Chapter
    from app.models.meeting_participant import MeetingParticipant
    from app.models.summary import Summary
    from app.models.topic import Topic
    from app.models.transcript_segment import TranscriptSegment


class Meeting(TimestampMixin, Base):
    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint(
            "duration_seconds >= 0", name="ck_meetings_duration_non_negative"
        ),
        CheckConstraint(
            "source_type IN ('seeded', 'pasted', 'upload')",
            name="ck_meetings_source_type",
        ),
        Index("ix_meetings_meeting_date", "meeting_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    meeting_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    media_url: Mapped[str | None] = mapped_column(String(2048))
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)

    participant_links: Mapped[list[MeetingParticipant]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    transcript_segments: Mapped[list[TranscriptSegment]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    summary: Mapped[Summary | None] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    action_items: Mapped[list[ActionItem]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    topics: Mapped[list[Topic]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    chapters: Mapped[list[Chapter]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
