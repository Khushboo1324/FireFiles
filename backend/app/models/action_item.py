from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    text as sql_text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.participant import Participant


class ActionItem(TimestampMixin, Base):
    __tablename__ = "action_items"
    __table_args__ = (
        CheckConstraint(
            "sequence_index >= 0", name="ck_action_items_sequence_non_negative"
        ),
        CheckConstraint(
            "timestamp_ms IS NULL OR timestamp_ms >= 0",
            name="ck_action_items_timestamp_non_negative",
        ),
        UniqueConstraint(
            "meeting_id", "sequence_index", name="uq_action_items_meeting_sequence"
        ),
        Index("ix_action_items_meeting_id", "meeting_id"),
        Index("ix_action_items_assignee_id", "assignee_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    assignee_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="SET NULL")
    )
    # Same-meeting assignee membership is intentionally a service-layer rule.
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    completed: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=sql_text("0"), nullable=False
    )
    timestamp_ms: Mapped[int | None] = mapped_column(Integer)

    meeting: Mapped[Meeting] = relationship(back_populates="action_items")
    assignee: Mapped[Participant | None] = relationship(
        back_populates="assigned_action_items"
    )
