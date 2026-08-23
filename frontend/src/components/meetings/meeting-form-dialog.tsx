"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { ApiError } from "@/lib/api/client";
import { createMeeting, getMeeting, updateMeeting } from "@/lib/api/meetings";
import type {
  MeetingCreateRequest,
  MeetingDetail,
  MeetingParticipantInput,
  MeetingUpdateRequest,
} from "@/lib/api/types";

interface ParticipantDraft {
  avatarUrl: string;
  email: string;
  isOrganizer: boolean;
  key: string;
  name: string;
}

interface MeetingDraft {
  durationMinutes: string;
  mediaUrl: string;
  meetingDate: string;
  participants: ParticipantDraft[];
  title: string;
}

interface ParticipantErrors {
  avatarUrl?: string;
  email?: string;
  name?: string;
}

interface MeetingErrors {
  duration?: string;
  mediaUrl?: string;
  meetingDate?: string;
  participantRows: Record<string, ParticipantErrors>;
  participants?: string;
  title?: string;
}

type MeetingFormDialogProps =
  | {
      initialMeeting?: never;
      meetingId?: never;
      mode: "create";
      onClose: () => void;
      onSuccess: (meeting: MeetingDetail) => void;
    }
  | {
      initialMeeting?: MeetingDetail;
      meetingId: number;
      mode: "edit";
      onClose: () => void;
      onSuccess: (meeting: MeetingDetail) => void;
    };

function currentLocalDateTime(): string {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function toLocalDateTimeInput(value: string): string {
  const date = new Date(value);
  // datetime-local has no zone, so offset the UTC instant into browser-local fields.
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function createDraft(): MeetingDraft {
  return {
    durationMinutes: "30",
    mediaUrl: "",
    meetingDate: currentLocalDateTime(),
    participants: [
      {
        avatarUrl: "",
        email: "",
        isOrganizer: true,
        key: "participant-new-0",
        name: "",
      },
    ],
    title: "",
  };
}

function editDraft(meeting: MeetingDetail): MeetingDraft {
  return {
    durationMinutes: String(meeting.duration_seconds / 60),
    mediaUrl: meeting.media_url ?? "",
    meetingDate: toLocalDateTimeInput(meeting.meeting_date),
    participants: meeting.participants.map((participant) => ({
      avatarUrl: participant.avatar_url ?? "",
      email: participant.email ?? "",
      // The detail response does not currently expose the association's organizer flag.
      isOrganizer: false,
      key: `participant-${participant.id}`,
      name: participant.name,
    })),
    title: meeting.title,
  };
}

function emptyErrors(): MeetingErrors {
  return { participantRows: {} };
}

function durationInSeconds(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const minutes = Number(value);
  const seconds = minutes * 60;
  return Number.isFinite(minutes) && minutes >= 0 && Number.isSafeInteger(seconds)
    ? seconds
    : null;
}

function normalizeParticipants(
  participants: ParticipantDraft[],
): MeetingParticipantInput[] {
  return participants.map((participant) => ({
    name: participant.name.trim(),
    email: participant.email.trim() || null,
    avatar_url: participant.avatarUrl.trim() || null,
    is_organizer: participant.isOrganizer,
  }));
}

function validateDraft(draft: MeetingDraft): MeetingErrors {
  const errors = emptyErrors();

  if (!draft.title.trim()) {
    errors.title = "Meeting title is required.";
  }
  if (!draft.meetingDate || Number.isNaN(new Date(draft.meetingDate).getTime())) {
    errors.meetingDate = "Choose a valid meeting date and time.";
  }
  if (durationInSeconds(draft.durationMinutes) === null) {
    errors.duration = "Enter zero or more minutes, resolving to whole seconds.";
  }
  if (draft.mediaUrl.trim().length > 2048) {
    errors.mediaUrl = "Media URL must be 2,048 characters or fewer.";
  }
  if (draft.participants.length === 0) {
    errors.participants = "Add at least one participant.";
  }

  const emailOwners = new Map<string, string[]>();
  for (const participant of draft.participants) {
    const rowErrors: ParticipantErrors = {};
    if (!participant.name.trim()) {
      rowErrors.name = "Name is required.";
    }
    if (participant.email.trim().length > 320) {
      rowErrors.email = "Email must be 320 characters or fewer.";
    }
    if (participant.avatarUrl.trim().length > 2048) {
      rowErrors.avatarUrl = "Avatar URL must be 2,048 characters or fewer.";
    }
    if (Object.keys(rowErrors).length > 0) {
      errors.participantRows[participant.key] = rowErrors;
    }

    const emailKey = participant.email.trim().toLowerCase();
    if (emailKey) {
      emailOwners.set(emailKey, [
        ...(emailOwners.get(emailKey) ?? []),
        participant.key,
      ]);
    }
  }

  for (const keys of emailOwners.values()) {
    if (keys.length < 2) {
      continue;
    }
    for (const key of keys) {
      errors.participantRows[key] = {
        ...errors.participantRows[key],
        email: "Participant emails must be unique.",
      };
    }
  }

  return errors;
}

function hasErrors(errors: MeetingErrors): boolean {
  return (
    Boolean(
      errors.title ||
        errors.meetingDate ||
        errors.duration ||
        errors.mediaUrl ||
        errors.participants,
    ) || Object.keys(errors.participantRows).length > 0
  );
}

function buildCreateRequest(draft: MeetingDraft): MeetingCreateRequest {
  const seconds = durationInSeconds(draft.durationMinutes);
  if (seconds === null) {
    throw new RangeError("Validated duration could not be converted to seconds.");
  }

  return {
    title: draft.title.trim(),
    meeting_date: new Date(draft.meetingDate).toISOString(),
    duration_seconds: seconds,
    media_url: draft.mediaUrl.trim() || null,
    participants: normalizeParticipants(draft.participants),
  };
}

function buildUpdateRequest(
  draft: MeetingDraft,
  baseline: MeetingDraft,
  meeting: MeetingDetail,
): MeetingUpdateRequest {
  const request: MeetingUpdateRequest = {};
  const title = draft.title.trim();
  const seconds = durationInSeconds(draft.durationMinutes);
  const mediaUrl = draft.mediaUrl.trim() || null;
  const participants = normalizeParticipants(draft.participants);
  const baselineParticipants = normalizeParticipants(baseline.participants);

  if (title !== meeting.title) {
    request.title = title;
  }
  if (draft.meetingDate !== baseline.meetingDate) {
    request.meeting_date = new Date(draft.meetingDate).toISOString();
  }
  if (seconds !== meeting.duration_seconds && seconds !== null) {
    request.duration_seconds = seconds;
  }
  if (mediaUrl !== meeting.media_url) {
    request.media_url = mediaUrl;
  }
  if (JSON.stringify(participants) !== JSON.stringify(baselineParticipants)) {
    // Supplying participants invokes backend replacement, so PATCH sends the full set.
    request.participants = participants;
  }

  return request;
}

function fieldClass(hasError: boolean): string {
  return `mt-1 h-9 w-full rounded-md border bg-white px-3 text-[12px] font-normal text-ff-text outline-none transition focus:ring-1 ${
    hasError
      ? "border-ff-error focus:border-ff-error focus:ring-ff-error"
      : "border-ff-border focus:border-ff-primary focus:ring-ff-primary"
  }`;
}

export function MeetingFormDialog(props: MeetingFormDialogProps) {
  const providedMeeting = props.mode === "edit" ? props.initialMeeting : undefined;
  const [meeting, setMeeting] = useState<MeetingDetail | null>(
    providedMeeting ?? null,
  );
  const [draft, setDraft] = useState<MeetingDraft | null>(() =>
    props.mode === "create"
      ? createDraft()
      : providedMeeting
        ? editDraft(providedMeeting)
        : null,
  );
  const [baseline, setBaseline] = useState<MeetingDraft | null>(() =>
    providedMeeting ? editDraft(providedMeeting) : null,
  );
  const [errors, setErrors] = useState<MeetingErrors>(emptyErrors);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const title = props.mode === "create" ? "New Meeting" : "Edit meeting";
  const editMeetingId = props.mode === "edit" ? props.meetingId : null;

  useEffect(() => {
    if (editMeetingId === null || providedMeeting) {
      return;
    }

    let ignoreResult = false;
    getMeeting(editMeetingId)
      .then((loadedMeeting) => {
        if (ignoreResult) {
          return;
        }
        const loadedDraft = editDraft(loadedMeeting);
        setMeeting(loadedMeeting);
        setDraft(loadedDraft);
        setBaseline(loadedDraft);
      })
      .catch(() => {
        if (!ignoreResult) {
          setLoadError(true);
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [editMeetingId, loadVersion, providedMeeting]);

  const participantErrorCount = useMemo(
    () => Object.keys(errors.participantRows).length,
    [errors.participantRows],
  );

  function updateParticipant(
    participantKey: string,
    update: Partial<ParticipantDraft>,
  ) {
    if (!draft) {
      return;
    }
    setDraft({
      ...draft,
      participants: draft.participants.map((participant) =>
        participant.key === participantKey
          ? { ...participant, ...update }
          : participant,
      ),
    });
    setErrors(emptyErrors());
    setRequestError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || isSubmitting) {
      return;
    }

    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    setRequestError(null);
    if (hasErrors(nextErrors)) {
      return;
    }

    if (props.mode === "edit" && meeting && baseline) {
      const update = buildUpdateRequest(draft, baseline, meeting);
      if (Object.keys(update).length === 0) {
        props.onClose();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const savedMeeting =
        props.mode === "create"
          ? await createMeeting(buildCreateRequest(draft))
          : meeting && baseline
            ? await updateMeeting(
                props.meetingId,
                buildUpdateRequest(draft, baseline, meeting),
              )
            : null;
      if (savedMeeting) {
        props.onSuccess(savedMeeting);
      }
    } catch (error: unknown) {
      if (
        props.mode === "edit" &&
        error instanceof ApiError &&
        error.status === 409
      ) {
        setRequestError(
          "This participant cannot be removed because they are referenced in the meeting transcript or action items.",
        );
      } else {
        setRequestError(
          props.mode === "create"
            ? "Couldn't create meeting. Check the fields and try again."
            : "Couldn't update meeting.",
        );
      }
      setIsSubmitting(false);
    }
  }

  const isLoading = props.mode === "edit" && !draft && !loadError;

  return (
    <Dialog
      busy={isSubmitting}
      maxWidthClass="max-w-[720px]"
      onClose={props.onClose}
      titleId="meeting-form-title"
    >
      <div className="flex shrink-0 items-start justify-between border-b border-ff-border px-5 py-4">
        <div>
          <h2
            className="text-[16px] font-semibold text-[#202536]"
            id="meeting-form-title"
          >
            {title}
          </h2>
          <p className="mt-1 text-[11px] text-ff-muted">
            {props.mode === "create"
              ? "Add a meeting to your FireFiles workspace."
              : "Update the meeting details stored in FireFiles."}
          </p>
        </div>
        <button
          aria-label={`Close ${title} dialog`}
          className="flex size-8 items-center justify-center rounded-md text-ff-muted hover:bg-ff-muted-surface hover:text-ff-text disabled:opacity-40"
          disabled={isSubmitting}
          onClick={props.onClose}
          type="button"
        >
          <Icon name="close" size={17} />
        </button>
      </div>

      {isLoading && (
        <div aria-label="Loading meeting details" className="space-y-3 p-5" role="status">
          <div className="h-9 animate-pulse rounded-md bg-ff-muted-surface" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-9 animate-pulse rounded-md bg-ff-muted-surface" />
            <div className="h-9 animate-pulse rounded-md bg-ff-muted-surface" />
          </div>
          <div className="h-24 animate-pulse rounded-md bg-ff-muted-surface" />
        </div>
      )}

      {loadError && (
        <div className="p-5 text-center" role="alert">
          <p className="text-[12px] font-medium text-ff-error">
            Couldn&apos;t load meeting details.
          </p>
          <button
            className="mt-3 h-8 rounded-md border border-ff-border px-3 text-[11px] font-semibold text-ff-text hover:bg-ff-muted-surface"
            onClick={() => {
              setLoadError(false);
              setLoadVersion((version) => version + 1);
            }}
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {draft && (
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(150px,0.8fr)] gap-3">
              <label className="text-[11px] font-semibold text-ff-text">
                Meeting title
                <input
                  aria-describedby={errors.title ? "meeting-title-error" : undefined}
                  aria-invalid={Boolean(errors.title)}
                  className={fieldClass(Boolean(errors.title))}
                  data-autofocus
                  maxLength={255}
                  onChange={(event) => {
                    setDraft({ ...draft, title: event.target.value });
                    setErrors(emptyErrors());
                  }}
                  placeholder="e.g. Product weekly sync"
                  type="text"
                  value={draft.title}
                />
                {errors.title && (
                  <span className="mt-1 block font-normal text-ff-error" id="meeting-title-error">
                    {errors.title}
                  </span>
                )}
              </label>

              <label className="text-[11px] font-semibold text-ff-text">
                Duration (minutes)
                <input
                  aria-describedby={errors.duration ? "meeting-duration-error" : undefined}
                  aria-invalid={Boolean(errors.duration)}
                  className={fieldClass(Boolean(errors.duration))}
                  min="0"
                  onChange={(event) => {
                    setDraft({ ...draft, durationMinutes: event.target.value });
                    setErrors(emptyErrors());
                  }}
                  step="any"
                  type="number"
                  value={draft.durationMinutes}
                />
                {errors.duration && (
                  <span className="mt-1 block font-normal text-ff-error" id="meeting-duration-error">
                    {errors.duration}
                  </span>
                )}
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-[11px] font-semibold text-ff-text">
                Meeting date and time
                <input
                  aria-describedby={errors.meetingDate ? "meeting-date-error" : undefined}
                  aria-invalid={Boolean(errors.meetingDate)}
                  className={fieldClass(Boolean(errors.meetingDate))}
                  onChange={(event) => {
                    setDraft({ ...draft, meetingDate: event.target.value });
                    setErrors(emptyErrors());
                  }}
                  type="datetime-local"
                  value={draft.meetingDate}
                />
                {errors.meetingDate && (
                  <span className="mt-1 block font-normal text-ff-error" id="meeting-date-error">
                    {errors.meetingDate}
                  </span>
                )}
              </label>

              <label className="text-[11px] font-semibold text-ff-text">
                Media URL <span className="font-normal text-ff-muted">(optional)</span>
                <input
                  aria-describedby={errors.mediaUrl ? "meeting-media-error" : undefined}
                  aria-invalid={Boolean(errors.mediaUrl)}
                  className={fieldClass(Boolean(errors.mediaUrl))}
                  maxLength={2048}
                  onChange={(event) => {
                    setDraft({ ...draft, mediaUrl: event.target.value });
                    setErrors(emptyErrors());
                  }}
                  placeholder="https://..."
                  type="url"
                  value={draft.mediaUrl}
                />
                {errors.mediaUrl && (
                  <span className="mt-1 block font-normal text-ff-error" id="meeting-media-error">
                    {errors.mediaUrl}
                  </span>
                )}
              </label>
            </div>

            <section aria-labelledby="meeting-participants-title" className="mt-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] font-semibold text-ff-text" id="meeting-participants-title">
                    Participants
                  </h3>
                  {props.mode === "edit" && (
                    <p className="mt-0.5 text-[10px] text-ff-muted">
                      Existing organizer roles are not exposed by the current API and appear off here.
                    </p>
                  )}
                </div>
                <button
                  className="flex h-8 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-ff-primary hover:bg-ff-primary-soft"
                  onClick={() => {
                    setDraft({
                      ...draft,
                      participants: [
                        ...draft.participants,
                        {
                          avatarUrl: "",
                          email: "",
                          isOrganizer: false,
                          key: `participant-new-${Date.now()}`,
                          name: "",
                        },
                      ],
                    });
                    setErrors(emptyErrors());
                  }}
                  type="button"
                >
                  <Icon name="plus" size={13} />
                  Add participant
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {draft.participants.map((participant, index) => {
                  const rowErrors = errors.participantRows[participant.key] ?? {};
                  return (
                    <div
                      className="rounded-md border border-ff-border bg-ff-muted-surface p-2"
                      key={participant.key}
                    >
                      <div className="grid grid-cols-[minmax(100px,1fr)_minmax(135px,1.15fr)_minmax(135px,1.1fr)_auto] items-start gap-2">
                        <label>
                          <span className="sr-only">Participant {index + 1} name</span>
                          <input
                            aria-describedby={rowErrors.name ? `${participant.key}-name-error` : undefined}
                            aria-invalid={Boolean(rowErrors.name)}
                            aria-label={`Participant ${index + 1} name`}
                            className={fieldClass(Boolean(rowErrors.name)).replace("mt-1", "")}
                            maxLength={255}
                            onChange={(event) => updateParticipant(participant.key, { name: event.target.value })}
                            placeholder="Name"
                            type="text"
                            value={participant.name}
                          />
                          {rowErrors.name && (
                            <span className="mt-1 block text-[10px] text-ff-error" id={`${participant.key}-name-error`}>
                              {rowErrors.name}
                            </span>
                          )}
                        </label>
                        <label>
                          <span className="sr-only">Participant {index + 1} email</span>
                          <input
                            aria-describedby={rowErrors.email ? `${participant.key}-email-error` : undefined}
                            aria-invalid={Boolean(rowErrors.email)}
                            aria-label={`Participant ${index + 1} email (optional)`}
                            className={fieldClass(Boolean(rowErrors.email)).replace("mt-1", "")}
                            maxLength={320}
                            onChange={(event) => updateParticipant(participant.key, { email: event.target.value })}
                            placeholder="Email (optional)"
                            type="email"
                            value={participant.email}
                          />
                          {rowErrors.email && (
                            <span className="mt-1 block text-[10px] text-ff-error" id={`${participant.key}-email-error`}>
                              {rowErrors.email}
                            </span>
                          )}
                        </label>
                        <label>
                          <span className="sr-only">Participant {index + 1} avatar URL</span>
                          <input
                            aria-describedby={rowErrors.avatarUrl ? `${participant.key}-avatar-error` : undefined}
                            aria-invalid={Boolean(rowErrors.avatarUrl)}
                            aria-label={`Participant ${index + 1} avatar URL (optional)`}
                            className={fieldClass(Boolean(rowErrors.avatarUrl)).replace("mt-1", "")}
                            maxLength={2048}
                            onChange={(event) => updateParticipant(participant.key, { avatarUrl: event.target.value })}
                            placeholder="Avatar URL (optional)"
                            type="url"
                            value={participant.avatarUrl}
                          />
                          {rowErrors.avatarUrl && (
                            <span className="mt-1 block text-[10px] text-ff-error" id={`${participant.key}-avatar-error`}>
                              {rowErrors.avatarUrl}
                            </span>
                          )}
                        </label>
                        <button
                          aria-label={`Remove participant ${index + 1}`}
                          className="flex size-9 items-center justify-center rounded-md text-ff-muted hover:bg-white hover:text-ff-error disabled:cursor-not-allowed disabled:opacity-35"
                          disabled={draft.participants.length === 1}
                          onClick={() => {
                            setDraft({
                              ...draft,
                              participants: draft.participants.filter((item) => item.key !== participant.key),
                            });
                            setErrors(emptyErrors());
                          }}
                          type="button"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                      <label className="mt-2 flex w-fit items-center gap-1.5 text-[10px] text-ff-muted">
                        <input
                          checked={participant.isOrganizer}
                          className="accent-[#630ed4]"
                          onChange={(event) => updateParticipant(participant.key, { isOrganizer: event.target.checked })}
                          type="checkbox"
                        />
                        Organizer
                      </label>
                    </div>
                  );
                })}
              </div>

              {errors.participants && (
                <p className="mt-1.5 text-[11px] font-medium text-ff-error">{errors.participants}</p>
              )}
              {participantErrorCount > 0 && !errors.participants && (
                <p className="sr-only" aria-live="polite">
                  Participant details contain {participantErrorCount} invalid row{participantErrorCount === 1 ? "" : "s"}.
                </p>
              )}
            </section>

            {requestError && (
              <p
                aria-live="assertive"
                className="mt-4 rounded-md border border-[#f2dada] bg-[#fffafa] px-3 py-2 text-[11px] font-medium leading-5 text-ff-error"
                role="alert"
              >
                {requestError}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-ff-border px-5 py-3.5">
            <button
              className="h-9 rounded-md border border-ff-border bg-white px-4 text-[12px] font-semibold text-ff-text hover:bg-ff-muted-surface disabled:opacity-50"
              disabled={isSubmitting}
              onClick={props.onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-9 min-w-28 rounded-md bg-ff-primary px-4 text-[12px] font-semibold text-white hover:bg-ff-primary-hover disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? props.mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : props.mode === "create"
                  ? "Create"
                  : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
