from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.participant import Participant


class TranscriptSegment(TimestampMixin, Base):
    __tablename__ = "transcript_segments"
    __table_args__ = (
        CheckConstraint(
            "sequence_index >= 0", name="ck_transcript_segments_sequence_non_negative"
        ),
        CheckConstraint(
            "start_time_ms >= 0", name="ck_transcript_segments_start_non_negative"
        ),
        CheckConstraint(
            "end_time_ms >= start_time_ms", name="ck_transcript_segments_time_order"
        ),
        UniqueConstraint(
            "meeting_id", "sequence_index", name="uq_transcript_segments_meeting_sequence"
        ),
        Index("ix_transcript_segments_meeting_start", "meeting_id", "start_time_ms"),
        Index("ix_transcript_segments_speaker_id", "speaker_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    speaker_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="SET NULL")
    )
    # The service layer must ensure a speaker is attached to this same meeting.
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    end_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    meeting: Mapped[Meeting] = relationship(back_populates="transcript_segments")
    speaker: Mapped[Participant | None] = relationship(
        back_populates="transcript_segments"
    )
