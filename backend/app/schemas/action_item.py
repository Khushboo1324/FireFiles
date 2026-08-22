from app.schemas.base import ORMResponseModel
from app.schemas.participant import ParticipantCompactResponse


class ActionItemResponse(ORMResponseModel):
    id: int
    sequence_index: int
    text: str
    completed: bool
    timestamp_ms: int | None
    assignee: ParticipantCompactResponse | None
