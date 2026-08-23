from datetime import date
from pathlib import Path as FilePath
from typing import Annotated, cast

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Path,
    Query,
    Response,
    UploadFile,
    status,
)
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.parsers.transcript import TranscriptParseError
from app.schemas.meeting import (
    MeetingCreateRequest,
    MeetingDetailResponse,
    MeetingListResponse,
    MeetingUpdateRequest,
)
from app.schemas.transcript_segment import TranscriptPasteRequest
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
from app.services.transcript_service import (
    TranscriptAlreadyExistsError,
    TranscriptFormat,
    TranscriptMeetingNotFoundError,
    import_transcript,
)


router = APIRouter(prefix="/meetings", tags=["meetings"])

MAX_TRANSCRIPT_UPLOAD_BYTES = 5 * 1024 * 1024
_UPLOAD_CONTENT_TYPES: dict[TranscriptFormat, set[str]] = {
    "txt": {"text/plain", "application/octet-stream"},
    "json": {"application/json", "text/json", "application/octet-stream"},
    "vtt": {"text/vtt", "text/plain", "application/octet-stream"},
}


def _transcript_http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, TranscriptMeetingNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, TranscriptAlreadyExistsError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if isinstance(exc, TranscriptParseError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        )
    raise exc


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


@router.post(
    "/{meeting_id}/transcript/paste",
    response_model=MeetingDetailResponse,
    summary="Import a pasted transcript",
)
def paste_transcript(
    meeting_id: Annotated[int, Path(ge=1)],
    request: TranscriptPasteRequest,
    session: Annotated[Session, Depends(get_db)],
) -> MeetingDetailResponse:
    try:
        meeting = import_transcript(
            session,
            meeting_id,
            request.content,
            "txt",
            replace_existing=request.replace_existing,
        )
    except (
        TranscriptMeetingNotFoundError,
        TranscriptAlreadyExistsError,
        TranscriptParseError,
    ) as exc:
        raise _transcript_http_error(exc) from exc
    return MeetingDetailResponse.model_validate(meeting)


@router.post(
    "/{meeting_id}/transcript/upload",
    response_model=MeetingDetailResponse,
    summary="Import an uploaded transcript",
)
async def upload_transcript(
    meeting_id: Annotated[int, Path(ge=1)],
    file: Annotated[UploadFile, File()],
    session: Annotated[Session, Depends(get_db)],
    replace_existing: Annotated[bool, Form()] = False,
) -> MeetingDetailResponse:
    extension = FilePath(file.filename or "").suffix.lower().lstrip(".")
    if extension not in _UPLOAD_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Supported transcript file types are .txt, .json, and .vtt",
        )
    transcript_format = cast(TranscriptFormat, extension)
    content_type = (file.content_type or "").partition(";")[0].lower()
    if content_type not in _UPLOAD_CONTENT_TYPES[transcript_format]:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Content type is not valid for .{extension} transcripts",
        )

    raw_content = await file.read(MAX_TRANSCRIPT_UPLOAD_BYTES + 1)
    if len(raw_content) > MAX_TRANSCRIPT_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Transcript upload exceeds the 5 MiB limit",
        )
    try:
        content = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Transcript file must be valid UTF-8",
        ) from exc

    try:
        meeting = import_transcript(
            session,
            meeting_id,
            content,
            transcript_format,
            replace_existing=replace_existing,
        )
    except (
        TranscriptMeetingNotFoundError,
        TranscriptAlreadyExistsError,
        TranscriptParseError,
    ) as exc:
        raise _transcript_http_error(exc) from exc
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
