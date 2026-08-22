from app.schemas.base import ORMResponseModel


class ChapterResponse(ORMResponseModel):
    id: int
    title: str
    summary: str | None
    start_time_ms: int
    end_time_ms: int | None
    sequence_index: int
