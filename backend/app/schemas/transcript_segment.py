from app.schemas.base import ORMResponseModel
from app.schemas.participant import ParticipantCompactResponse


class TranscriptSegmentResponse(ORMResponseModel):
    id: int
    sequence_index: int
    start_time_ms: int
    end_time_ms: int
    text: str
    speaker: ParticipantCompactResponse | None
