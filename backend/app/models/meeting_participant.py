from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, Integer, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.participant import Participant


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"
    __table_args__ = (
        Index("ix_meeting_participants_participant_meeting", "participant_id", "meeting_id"),
    )

    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True
    )
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True
    )
    is_organizer: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("0"), nullable=False
    )

    meeting: Mapped[Meeting] = relationship(back_populates="participant_links")
    participant: Mapped[Participant] = relationship(back_populates="meeting_links")
