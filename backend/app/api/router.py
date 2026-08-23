from fastapi import APIRouter

from app.api.routes.action_items import router as action_items_router
from app.api.routes.meetings import router as meetings_router


api_router = APIRouter(prefix="/api")
api_router.include_router(action_items_router)
api_router.include_router(meetings_router)
