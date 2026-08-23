from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.base import ORMResponseModel
from app.schemas.participant import ParticipantCompactResponse


class TranscriptPasteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1)
    replace_existing: bool = False

    @field_validator("content", mode="before")
    @classmethod
    def validate_content_not_blank(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            raise ValueError("content must not be blank")
        return value


class TranscriptSegmentResponse(ORMResponseModel):
    id: int
    sequence_index: int
    start_time_ms: int
    end_time_ms: int
    text: str
    speaker: ParticipantCompactResponse | None
