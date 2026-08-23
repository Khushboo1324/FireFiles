from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.base import ORMResponseModel


class MeetingParticipantInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=320)
    avatar_url: str | None = Field(default=None, max_length=2048)
    is_organizer: bool = False

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("name must not be blank")
            return normalized
        return value

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None
        return value


class ParticipantCompactResponse(ORMResponseModel):
    id: int
    name: str
    avatar_url: str | None

    @model_validator(mode="before")
    @classmethod
    def unwrap_meeting_participant(cls, value: Any) -> Any:
        # Meetings store association objects, but clients only need the person.
        return getattr(value, "participant", value)


class ParticipantResponse(ParticipantCompactResponse):
    email: str | None
