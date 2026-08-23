from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.base import ORMResponseModel
from app.schemas.participant import ParticipantCompactResponse


class ActionItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1)
    assignee_id: int | None = Field(default=None, gt=0)
    timestamp_ms: int | None = Field(default=None, ge=0)

    @field_validator("text", mode="before")
    @classmethod
    def normalize_text(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("text must not be blank")
            return normalized
        return value


class ActionItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str | None = Field(default=None, min_length=1)
    completed: bool | None = None
    assignee_id: int | None = Field(default=None, gt=0)
    timestamp_ms: int | None = Field(default=None, ge=0)

    @field_validator("text", mode="before")
    @classmethod
    def normalize_text(cls, value: object) -> object:
        if value is None:
            raise ValueError("text cannot be null")
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("text must not be blank")
            return normalized
        return value

    @field_validator("completed", mode="before")
    @classmethod
    def reject_null_completed(cls, value: object) -> object:
        if value is None:
            raise ValueError("completed cannot be null")
        return value


class ActionItemResponse(ORMResponseModel):
    id: int
    sequence_index: int
    text: str
    completed: bool
    timestamp_ms: int | None
    assignee: ParticipantCompactResponse | None
