from datetime import datetime

from pydantic import AliasPath, Field

from app.schemas.action_item import ActionItemResponse
from app.schemas.base import ORMResponseModel
from app.schemas.chapter import ChapterResponse
from app.schemas.participant import ParticipantCompactResponse, ParticipantResponse
from app.schemas.summary import SummaryResponse
from app.schemas.topic import TopicResponse
from app.schemas.transcript_segment import TranscriptSegmentResponse


class MeetingListItemResponse(ORMResponseModel):
    id: int
    title: str
    meeting_date: datetime
    duration_seconds: int
    media_url: str | None
    source_type: str
    participants: list[ParticipantCompactResponse] = Field(
        validation_alias="participant_links"
    )
    short_summary: str | None = Field(
        default=None,
        validation_alias=AliasPath("summary", "short_summary"),
    )


class MeetingListResponse(ORMResponseModel):
    items: list[MeetingListItemResponse]
    total: int


class MeetingDetailResponse(ORMResponseModel):
    id: int
    title: str
    meeting_date: datetime
    duration_seconds: int
    media_url: str | None
    source_type: str
    participants: list[ParticipantResponse] = Field(
        validation_alias="participant_links"
    )
    summary: SummaryResponse | None
    transcript_segments: list[TranscriptSegmentResponse]
    action_items: list[ActionItemResponse]
    topics: list[TopicResponse]
    chapters: list[ChapterResponse]
