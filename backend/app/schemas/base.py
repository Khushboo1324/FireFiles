from pydantic import BaseModel, ConfigDict


class ORMResponseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
