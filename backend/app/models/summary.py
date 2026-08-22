from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class Summary(TimestampMixin, Base):
    __tablename__ = "summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    overview: Mapped[str] = mapped_column(Text, nullable=False)
    short_summary: Mapped[str | None] = mapped_column(Text)

    meeting: Mapped[Meeting] = relationship(back_populates="summary")
