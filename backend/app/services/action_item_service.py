from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import ActionItem, Meeting, MeetingParticipant
from app.schemas.action_item import ActionItemCreate, ActionItemUpdate


class AssigneeMembershipConflictError(Exception):
    """Raised when an action-item assignee is outside its meeting."""


def _validate_assignee_membership(
    session: Session, meeting_id: int, assignee_id: int
) -> None:
    membership = session.scalar(
        select(MeetingParticipant.participant_id).where(
            MeetingParticipant.meeting_id == meeting_id,
            MeetingParticipant.participant_id == assignee_id,
        )
    )
    if membership is None:
        # Membership, rather than global existence, is the action-item invariant.
        raise AssigneeMembershipConflictError(
            "Assignee must be a participant in this meeting"
        )


def _load_action_item(session: Session, action_item_id: int) -> ActionItem | None:
    return session.scalar(
        select(ActionItem)
        .where(ActionItem.id == action_item_id)
        .options(selectinload(ActionItem.assignee))
    )


def _reload_action_item(session: Session, action_item_id: int) -> ActionItem:
    session.expire_all()
    action_item = _load_action_item(session, action_item_id)
    if action_item is None:
        raise RuntimeError("Committed action item could not be reloaded")
    return action_item


def create_action_item(
    session: Session, meeting_id: int, request: ActionItemCreate
) -> ActionItem | None:
    try:
        meeting_exists = session.scalar(
            select(Meeting.id).where(Meeting.id == meeting_id)
        )
        if meeting_exists is None:
            return None

        if request.assignee_id is not None:
            _validate_assignee_membership(
                session, meeting_id, request.assignee_id
            )

        current_max = session.scalar(
            select(func.max(ActionItem.sequence_index)).where(
                ActionItem.meeting_id == meeting_id
            )
        )
        # Appending after the maximum preserves stable ordering without filling gaps.
        next_sequence_index = 0 if current_max is None else current_max + 1
        action_item = ActionItem(
            meeting_id=meeting_id,
            assignee_id=request.assignee_id,
            sequence_index=next_sequence_index,
            text=request.text,
            completed=False,
            timestamp_ms=request.timestamp_ms,
        )
        session.add(action_item)
        session.commit()
        return _reload_action_item(session, action_item.id)
    except Exception:
        session.rollback()
        raise


def update_action_item(
    session: Session, action_item_id: int, request: ActionItemUpdate
) -> ActionItem | None:
    action_item = _load_action_item(session, action_item_id)
    if action_item is None:
        return None

    updates = request.model_dump(exclude_unset=True)
    if not updates:
        return action_item

    try:
        assignee_id = updates.get("assignee_id")
        if assignee_id is not None:
            _validate_assignee_membership(
                session, action_item.meeting_id, assignee_id
            )

        # exclude_unset preserves omitted fields while retaining explicit nullable clears.
        for field_name, value in updates.items():
            setattr(action_item, field_name, value)

        session.commit()
        return _reload_action_item(session, action_item.id)
    except Exception:
        session.rollback()
        raise


def delete_action_item(session: Session, action_item_id: int) -> bool:
    action_item = session.get(ActionItem, action_item_id)
    if action_item is None:
        return False

    try:
        session.delete(action_item)
        session.commit()
        return True
    except Exception:
        session.rollback()
        raise
