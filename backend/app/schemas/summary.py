from app.schemas.base import ORMResponseModel


class SummaryResponse(ORMResponseModel):
    id: int
    overview: str
    short_summary: str | None
