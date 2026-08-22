from app.schemas.base import ORMResponseModel


class TopicResponse(ORMResponseModel):
    id: int
    name: str
    sequence_index: int
