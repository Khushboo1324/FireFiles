from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    ActionItem,
    Meeting,
    MeetingParticipant,
    Participant,
    TranscriptSegment,
)
from app.schemas.meeting import MeetingCreateRequest, MeetingUpdateRequest
from app.schemas.participant import MeetingParticipantInput
from app.services.meeting_service import get_meeting_detail


class ParticipantRemovalConflictError(Exception):
    """Raised when meeting-owned content still references a removed participant."""


def _get_meeting_for_update(session: Session, meeting_id: int) -> Meeting | None:
    return session.scalar(
        select(Meeting)
        .where(Meeting.id == meeting_id)
        .options(selectinload(Meeting.participant_links))
    )


def _resolve_participant(
    session: Session, participant_input: MeetingParticipantInput
) -> Participant:
    if participant_input.email is not None:
        participant = session.scalar(
            select(Participant).where(
                Participant.email == participant_input.email
            )
        )
        if participant is not None:
            # Email identifies the global person, but meeting-specific display input
            # must not unexpectedly rewrite their name or avatar everywhere else.
            return participant

    # Without an email there is no safe global identity key: names are not unique.
    participant = Participant(
        name=participant_input.name,
        email=participant_input.email,
        avatar_url=participant_input.avatar_url,
    )
    session.add(participant)
    return participant


def _resolve_participants(
    session: Session, participant_inputs: list[MeetingParticipantInput]
) -> list[tuple[Participant, bool]]:
    resolved = [
        (_resolve_participant(session, item), item.is_organizer)
        for item in participant_inputs
    ]
    session.flush()
    return resolved


def _validate_participant_removals(
    session: Session, meeting_id: int, removed_participant_ids: set[int]
) -> None:
    if not removed_participant_ids:
        return

    referenced_as_speaker = session.scalar(
        select(TranscriptSegment.id)
        .where(
            TranscriptSegment.meeting_id == meeting_id,
            TranscriptSegment.speaker_id.in_(removed_participant_ids),
        )
        .limit(1)
    )
    referenced_as_assignee = session.scalar(
        select(ActionItem.id)
        .where(
            ActionItem.meeting_id == meeting_id,
            ActionItem.assignee_id.in_(removed_participant_ids),
        )
        .limit(1)
    )

    if referenced_as_speaker is not None or referenced_as_assignee is not None:
        # Membership is a domain invariant even though the schema intentionally
        # avoids complicated composite foreign keys for speaker and assignee IDs.
        raise ParticipantRemovalConflictError(
            "Cannot remove participants referenced by this meeting's "
            "transcript or action items"
        )


def _replace_participant_links(
    session: Session,
    meeting: Meeting,
    participant_inputs: list[MeetingParticipantInput],
) -> None:
    resolved_participants = _resolve_participants(session, participant_inputs)
    desired_participant_ids = {
        participant.id for participant, _ in resolved_participants
    }
    existing_links_by_participant_id = {
        link.participant_id: link for link in meeting.participant_links
    }
    removed_participant_ids = (
        set(existing_links_by_participant_id) - desired_participant_ids
    )

    # Validate before changing links so failed replacement cannot leave membership
    # inconsistent with meeting-owned transcript or action-item references.
    _validate_participant_removals(session, meeting.id, removed_participant_ids)

    replacement_links: list[MeetingParticipant] = []
    for participant, is_organizer in resolved_participants:
        link = existing_links_by_participant_id.get(participant.id)
        if link is None:
            link = MeetingParticipant(participant=participant)
        link.is_organizer = is_organizer
        replacement_links.append(link)
    meeting.participant_links = replacement_links


def _reload_meeting_detail(session: Session, meeting_id: int) -> Meeting:
    session.expire_all()
    meeting = get_meeting_detail(session, meeting_id)
    if meeting is None:
        raise RuntimeError("Committed meeting could not be reloaded")
    return meeting


def create_meeting(session: Session, request: MeetingCreateRequest) -> Meeting:
    try:
        resolved_participants = _resolve_participants(session, request.participants)
        meeting = Meeting(
            title=request.title,
            meeting_date=request.meeting_date,
            duration_seconds=request.duration_seconds,
            media_url=request.media_url,
            source_type="pasted",
            participant_links=[
                MeetingParticipant(
                    participant=participant,
                    is_organizer=is_organizer,
                )
                for participant, is_organizer in resolved_participants
            ],
        )
        session.add(meeting)
        session.commit()
        return _reload_meeting_detail(session, meeting.id)
    except Exception:
        session.rollback()
        raise


def update_meeting(
    session: Session, meeting_id: int, request: MeetingUpdateRequest
) -> Meeting | None:
    meeting = _get_meeting_for_update(session, meeting_id)
    if meeting is None:
        return None

    try:
        updates = request.model_dump(
            exclude={"participants"},
            exclude_unset=True,
        )
        # exclude_unset is what distinguishes omitted PATCH fields from explicit
        # values such as media_url=null.
        for field_name, value in updates.items():
            setattr(meeting, field_name, value)

        if "participants" in request.model_fields_set:
            assert request.participants is not None
            _replace_participant_links(session, meeting, request.participants)

        session.commit()
        return _reload_meeting_detail(session, meeting.id)
    except Exception:
        session.rollback()
        raise


def delete_meeting(session: Session, meeting_id: int) -> bool:
    meeting = session.get(Meeting, meeting_id)
    if meeting is None:
        return False

    try:
        # Database/ORM cascades own meeting children; participants are independent.
        session.delete(meeting)
        session.commit()
        return True
    except Exception:
        session.rollback()
        raise
