from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.meeting import MeetingListResponse
from app.services.meeting_service import MeetingSort, list_meetings


router = APIRouter(prefix="/meetings", tags=["meetings"])


class MeetingListQuery(BaseModel):
    search: str | None = None
    participant: str | None = None
    date_from: date | None = None
    date_to: date | None = None
    sort: MeetingSort = "newest"
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

    @field_validator("search", "participant", mode="before")
    @classmethod
    def normalize_optional_filter(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None
        return value

    @model_validator(mode="after")
    def validate_date_range(self) -> "MeetingListQuery":
        if (
            self.date_from is not None
            and self.date_to is not None
            and self.date_from > self.date_to
        ):
            raise ValueError("date_from must be on or before date_to")
        return self


@router.get(
    "",
    response_model=MeetingListResponse,
    summary="List meetings",
)
def get_meetings(
    query: Annotated[MeetingListQuery, Query()],
    session: Annotated[Session, Depends(get_db)],
) -> MeetingListResponse:
    meetings, total = list_meetings(
        session,
        search=query.search,
        participant_name=query.participant,
        date_from=query.date_from,
        date_to=query.date_to,
        sort=query.sort,
        limit=query.limit,
        offset=query.offset,
    )
    return MeetingListResponse(items=meetings, total=total)
