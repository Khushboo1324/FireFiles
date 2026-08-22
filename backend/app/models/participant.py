from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.action_item import ActionItem
    from app.models.meeting_participant import MeetingParticipant
    from app.models.transcript_segment import TranscriptSegment


class Participant(TimestampMixin, Base):
    __tablename__ = "participants"
    __table_args__ = (Index("ix_participants_name", "name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # NOCASE makes SQLite uniqueness match normal email case-insensitivity.
    email: Mapped[str | None] = mapped_column(
        String(320, collation="NOCASE"), unique=True
    )
    avatar_url: Mapped[str | None] = mapped_column(String(2048))

    meeting_links: Mapped[list[MeetingParticipant]] = relationship(
        back_populates="participant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    transcript_segments: Mapped[list[TranscriptSegment]] = relationship(
        back_populates="speaker", passive_deletes=True
    )
    assigned_action_items: Mapped[list[ActionItem]] = relationship(
        back_populates="assignee", passive_deletes=True
    )
