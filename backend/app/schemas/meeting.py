from datetime import datetime

from pydantic import (
    AliasPath,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.schemas.action_item import ActionItemResponse
from app.schemas.base import ORMResponseModel
from app.schemas.chapter import ChapterResponse
from app.schemas.participant import (
    MeetingParticipantInput,
    ParticipantCompactResponse,
    ParticipantResponse,
)
from app.schemas.summary import SummaryResponse
from app.schemas.topic import TopicResponse
from app.schemas.transcript_segment import TranscriptSegmentResponse


def _validate_unique_participant_emails(
    participants: list[MeetingParticipantInput],
) -> list[MeetingParticipantInput]:
    seen_emails: set[str] = set()
    for participant in participants:
        if participant.email is None:
            continue
        email_key = participant.email.casefold()
        if email_key in seen_emails:
            raise ValueError("participants must not contain duplicate emails")
        seen_emails.add(email_key)
    return participants


class MeetingCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    meeting_date: datetime
    duration_seconds: int = Field(ge=0)
    media_url: str | None = Field(default=None, max_length=2048)
    participants: list[MeetingParticipantInput] = Field(min_length=1)

    @field_validator("title", mode="before")
    @classmethod
    def normalize_title(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("title must not be blank")
            return normalized
        return value

    @field_validator("participants")
    @classmethod
    def validate_participant_emails(
        cls, participants: list[MeetingParticipantInput]
    ) -> list[MeetingParticipantInput]:
        return _validate_unique_participant_emails(participants)


class MeetingUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, max_length=255)
    meeting_date: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    media_url: str | None = Field(default=None, max_length=2048)
    participants: list[MeetingParticipantInput] | None = Field(
        default=None, min_length=1
    )

    @field_validator("title", mode="before")
    @classmethod
    def normalize_title(cls, value: object) -> object:
        if value is None:
            raise ValueError("title cannot be null")
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("title must not be blank")
            return normalized
        return value

    @model_validator(mode="after")
    def validate_supplied_non_nullable_fields(self) -> "MeetingUpdateRequest":
        for field_name in ("meeting_date", "duration_seconds", "participants"):
            if (
                field_name in self.model_fields_set
                and getattr(self, field_name) is None
            ):
                raise ValueError(f"{field_name} cannot be null")
        if self.participants is not None:
            _validate_unique_participant_emails(self.participants)
        return self


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
