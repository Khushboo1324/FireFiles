from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class Chapter(Base):
    __tablename__ = "chapters"
    __table_args__ = (
        CheckConstraint(
            "sequence_index >= 0", name="ck_chapters_sequence_non_negative"
        ),
        CheckConstraint(
            "start_time_ms >= 0", name="ck_chapters_start_non_negative"
        ),
        CheckConstraint(
            "end_time_ms IS NULL OR end_time_ms >= start_time_ms",
            name="ck_chapters_time_order",
        ),
        UniqueConstraint(
            "meeting_id", "sequence_index", name="uq_chapters_meeting_sequence"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    start_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    end_time_ms: Mapped[int | None] = mapped_column(Integer)
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False)

    meeting: Mapped[Meeting] = relationship(back_populates="chapters")
