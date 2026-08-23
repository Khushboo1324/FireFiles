from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.meeting import (
    MeetingCreateRequest,
    MeetingDetailResponse,
    MeetingListResponse,
    MeetingUpdateRequest,
)
from app.services.meeting_service import (
    MeetingSort,
    get_meeting_detail,
    list_meetings,
)
from app.services.meeting_write_service import (
    ParticipantRemovalConflictError,
    create_meeting,
    delete_meeting,
    update_meeting,
)


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


@router.post(
    "",
    response_model=MeetingDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a meeting",
)
def post_meeting(
    request: MeetingCreateRequest,
    session: Annotated[Session, Depends(get_db)],
) -> MeetingDetailResponse:
    meeting = create_meeting(session, request)
    return MeetingDetailResponse.model_validate(meeting)


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


@router.get(
    "/{meeting_id}",
    response_model=MeetingDetailResponse,
    summary="Get meeting details",
)
def get_meeting(
    meeting_id: Annotated[int, Path(ge=1)],
    session: Annotated[Session, Depends(get_db)],
) -> MeetingDetailResponse:
    meeting = get_meeting_detail(session, meeting_id)
    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    return MeetingDetailResponse.model_validate(meeting)


@router.patch(
    "/{meeting_id}",
    response_model=MeetingDetailResponse,
    summary="Update a meeting",
)
def patch_meeting(
    meeting_id: Annotated[int, Path(ge=1)],
    request: MeetingUpdateRequest,
    session: Annotated[Session, Depends(get_db)],
) -> MeetingDetailResponse:
    try:
        meeting = update_meeting(session, meeting_id, request)
    except ParticipantRemovalConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    return MeetingDetailResponse.model_validate(meeting)


@router.delete(
    "/{meeting_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a meeting",
)
def remove_meeting(
    meeting_id: Annotated[int, Path(ge=1)],
    session: Annotated[Session, Depends(get_db)],
) -> Response:
    if not delete_meeting(session, meeting_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
