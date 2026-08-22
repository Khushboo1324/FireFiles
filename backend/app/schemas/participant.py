from typing import Any

from pydantic import model_validator

from app.schemas.base import ORMResponseModel


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
