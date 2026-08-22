from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class Topic(Base):
    __tablename__ = "topics"
    __table_args__ = (
        CheckConstraint("sequence_index >= 0", name="ck_topics_sequence_non_negative"),
        UniqueConstraint(
            "meeting_id", "sequence_index", name="uq_topics_meeting_sequence"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False)

    meeting: Mapped[Meeting] = relationship(back_populates="topics")
