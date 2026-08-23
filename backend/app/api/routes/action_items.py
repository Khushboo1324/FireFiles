from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.action_item import (
    ActionItemCreate,
    ActionItemResponse,
    ActionItemUpdate,
)
from app.services.action_item_service import (
    AssigneeMembershipConflictError,
    create_action_item,
    delete_action_item,
    update_action_item,
)


router = APIRouter(tags=["action items"])


@router.post(
    "/meetings/{meeting_id}/action-items",
    response_model=ActionItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an action item",
)
def post_action_item(
    meeting_id: Annotated[int, Path(ge=1)],
    request: ActionItemCreate,
    session: Annotated[Session, Depends(get_db)],
) -> ActionItemResponse:
    try:
        action_item = create_action_item(session, meeting_id, request)
    except AssigneeMembershipConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    if action_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    return ActionItemResponse.model_validate(action_item)


@router.patch(
    "/action-items/{action_item_id}",
    response_model=ActionItemResponse,
    summary="Update an action item",
)
def patch_action_item(
    action_item_id: Annotated[int, Path(ge=1)],
    request: ActionItemUpdate,
    session: Annotated[Session, Depends(get_db)],
) -> ActionItemResponse:
    try:
        action_item = update_action_item(session, action_item_id, request)
    except AssigneeMembershipConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    if action_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found",
        )
    return ActionItemResponse.model_validate(action_item)


@router.delete(
    "/action-items/{action_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an action item",
)
def remove_action_item(
    action_item_id: Annotated[int, Path(ge=1)],
    session: Annotated[Session, Depends(get_db)],
) -> Response:
    if not delete_action_item(session, action_item_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
