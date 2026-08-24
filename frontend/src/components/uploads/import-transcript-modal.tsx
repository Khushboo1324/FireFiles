"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Dialog } from "@/components/ui/dialog";
import { MeetingSelector } from "@/components/uploads/meeting-selector";
import {
  NewMeetingForm,
  type NewMeetingDraft,
  type NewMeetingValidation,
} from "@/components/uploads/new-meeting-form";
import { Icon } from "@/components/ui/icon";
import { ApiError } from "@/lib/api/client";
import { createMeeting } from "@/lib/api/meetings";
import { pasteTranscript, uploadTranscript } from "@/lib/api/transcripts";
import type { MeetingCreateRequest } from "@/lib/api/types";

export type ImportSource =
  | { kind: "file"; file: File }
  | { kind: "paste" };

type Workflow = "existing" | "new";
type PendingStage = "creating" | "importing" | null;

function currentLocalDateTime(): string {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function initialMeetingDraft(): NewMeetingDraft {
  return {
    title: "",
    meetingDate: currentLocalDateTime(),
    durationMinutes: "30",
    participants: [{ name: "", email: "", isOrganizer: true }],
  };
}

function validateNewMeeting(draft: NewMeetingDraft): NewMeetingValidation {
  const errors: NewMeetingValidation = {};
  const duration = Number(draft.durationMinutes);

  if (!draft.title.trim()) {
    errors.title = "Meeting title is required.";
  }
  if (!draft.meetingDate || Number.isNaN(new Date(draft.meetingDate).getTime())) {
    errors.meetingDate = "Choose a valid meeting date and time.";
  }
  if (!Number.isInteger(duration) || duration <= 0) {
    errors.duration = "Enter a whole number greater than zero.";
  }
  if (
    draft.participants.length === 0 ||
    draft.participants.some((participant) => !participant.name.trim())
  ) {
    errors.participants = "Add a name for every participant.";
  }
  return errors;
}

function buildCreateRequest(draft: NewMeetingDraft): MeetingCreateRequest {
  return {
    title: draft.title.trim(),
    meeting_date: new Date(draft.meetingDate).toISOString(),
    duration_seconds: Number(draft.durationMinutes) * 60,
    participants: draft.participants.map((participant) => ({
      name: participant.name.trim(),
      email: participant.email.trim() || null,
      avatar_url: null,
      is_organizer: participant.isOrganizer,
    })),
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function importErrorMessage(error: unknown): string {
  const status = error instanceof ApiError ? error.status : null;
  switch (status) {
    case 404:
      return "That meeting could not be found. It may have been removed.";
    case 413:
      return "The transcript file exceeds the 5 MiB upload limit.";
    case 415:
      return "The backend rejected this file type. Choose a TXT, JSON, or VTT file.";
    case 422:
      return "The transcript could not be parsed. Check its timestamps and formatting.";
    default:
      return status === null
        ? "Could not connect to FireFiles. Check the API and try again."
        : "The transcript could not be imported. Please try again.";
  }
}

function createErrorMessage(error: unknown): string {
  const status = error instanceof ApiError ? error.status : null;
  if (status === 422) {
    return "The meeting details were not accepted. Check the fields and try again.";
  }
  return status === null
    ? "Could not connect to FireFiles. Check the API and try again."
    : "The meeting could not be created. Please try again.";
}

export function ImportTranscriptModal({
  source,
  onClose,
  onOpenMeeting,
  onSuccess,
}: {
  source: ImportSource;
  onClose: () => void;
  onOpenMeeting: (meetingId: number) => void;
  onSuccess: (meetingId: number) => void;
}) {
  const [workflow, setWorkflow] = useState<Workflow>("existing");
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [meetingDraft, setMeetingDraft] = useState(initialMeetingDraft);
  const [meetingErrors, setMeetingErrors] = useState<NewMeetingValidation>({});
  const [showMeetingValidation, setShowMeetingValidation] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingStage, setPendingStage] = useState<PendingStage>(null);
  const [conflictMeetingId, setConflictMeetingId] = useState<number | null>(null);
  const [createdMeetingId, setCreatedMeetingId] = useState<number | null>(null);

  const fileDetails = useMemo(() => {
    if (source.kind !== "file") {
      return null;
    }
    return {
      extension: source.file.name.split(".").pop()?.toUpperCase() ?? "FILE",
      size: formatFileSize(source.file.size),
    };
  }, [source]);

  async function importIntoMeeting(meetingId: number, replaceExisting: boolean) {
    if (source.kind === "file") {
      await uploadTranscript(meetingId, source.file, replaceExisting);
    } else {
      await pasteTranscript(meetingId, pasteContent.trim(), replaceExisting);
    }
  }

  async function completeImport(meetingId: number, replaceExisting: boolean) {
    setPendingStage("importing");
    setError(null);
    setConflictMeetingId(null);
    let succeeded = false;
    try {
      await importIntoMeeting(meetingId, replaceExisting);
      succeeded = true;
    } catch (importError) {
      if (importError instanceof ApiError && importError.status === 409) {
        setConflictMeetingId(meetingId);
      } else {
        setError(importErrorMessage(importError));
      }
    } finally {
      setPendingStage(null);
    }
    if (succeeded) {
      onSuccess(meetingId);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingStage !== null) {
      return;
    }

    setError(null);
    setConflictMeetingId(null);
    setShowMeetingValidation(workflow === "existing");

    if (source.kind === "paste" && !pasteContent.trim()) {
      setPasteError("Transcript cannot be empty.");
      return;
    }
    setPasteError(null);

    if (workflow === "existing") {
      if (selectedMeetingId === null) {
        return;
      }
      await completeImport(selectedMeetingId, false);
      return;
    }

    const validation = validateNewMeeting(meetingDraft);
    setMeetingErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    if (createdMeetingId !== null) {
      await completeImport(createdMeetingId, false);
      return;
    }

    setPendingStage("creating");
    let newMeetingId: number;
    try {
      const meeting = await createMeeting(buildCreateRequest(meetingDraft));
      newMeetingId = meeting.id;
      setCreatedMeetingId(meeting.id);
    } catch (createError) {
      setError(createErrorMessage(createError));
      setPendingStage(null);
      return;
    }

    setPendingStage("importing");
    let importSucceeded = false;
    try {
      await importIntoMeeting(newMeetingId, false);
      importSucceeded = true;
    } catch (importError) {
      if (importError instanceof ApiError && importError.status === 409) {
        setConflictMeetingId(newMeetingId);
      } else {
        setError(importErrorMessage(importError));
      }
    } finally {
      setPendingStage(null);
    }
    if (importSucceeded) {
      onSuccess(newMeetingId);
    }
  }

  const primaryLabel =
    pendingStage === "creating"
      ? "Creating meeting..."
      : pendingStage === "importing"
        ? source.kind === "file"
          ? "Uploading transcript..."
          : "Importing transcript..."
        : source.kind === "file"
          ? "Upload Transcript"
          : "Import Transcript";

  return (
    <Dialog
      busy={pendingStage !== null}
      maxWidthClass="max-w-[590px]"
      onClose={onClose}
      titleId="import-transcript-title"
    >
      <>
        <div className="flex shrink-0 items-start justify-between border-b border-ff-border px-5 py-4">
          <div>
            <h2
              className="text-[16px] font-semibold text-[#202536]"
              id="import-transcript-title"
            >
              Import transcript
            </h2>
            <p className="mt-1 text-[11px] text-ff-muted">
              Attach the transcript to a real meeting in your library.
            </p>
          </div>
          <button
            aria-label="Close import transcript dialog"
            className="flex size-8 items-center justify-center rounded-md text-ff-muted transition-colors hover:bg-ff-muted-surface hover:text-ff-text disabled:opacity-40"
            data-autofocus
            disabled={pendingStage !== null}
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {conflictMeetingId !== null ? (
              <section className="rounded-lg border border-[#e6d7ff] bg-[#fbf9ff] p-5 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-ff-primary-soft text-ff-primary">
                  <Icon name="history" size={19} />
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-ff-text">
                  This meeting already has a transcript.
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-ff-muted">
                  Replacing it will remove the current transcript segments. The
                  backend keeps the operation atomic if the new transcript is invalid.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    className="h-9 rounded-md border border-ff-border bg-white px-4 text-[12px] font-semibold text-ff-text hover:bg-ff-muted-surface"
                    onClick={() => setConflictMeetingId(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="h-9 rounded-md bg-ff-primary px-4 text-[12px] font-semibold text-white hover:bg-ff-primary-hover"
                    onClick={() => completeImport(conflictMeetingId, true)}
                    type="button"
                  >
                    Replace Transcript
                  </button>
                </div>
              </section>
            ) : createdMeetingId !== null && error ? (
              <section className="rounded-lg border border-[#f0d6d6] bg-[#fffafa] p-5 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#fff0f0] text-ff-error">
                  <Icon name="support" size={19} />
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-ff-text">
                  Meeting was created, but the transcript could not be uploaded.
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-ff-muted">{error}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    className="h-9 rounded-md border border-ff-border bg-white px-4 text-[12px] font-semibold text-ff-text hover:bg-ff-muted-surface"
                    onClick={() => onOpenMeeting(createdMeetingId)}
                    type="button"
                  >
                    Open Meeting
                  </button>
                  <button
                    className="h-9 rounded-md bg-ff-primary px-4 text-[12px] font-semibold text-white hover:bg-ff-primary-hover"
                    onClick={() => completeImport(createdMeetingId, false)}
                    type="button"
                  >
                    Retry Upload
                  </button>
                </div>
              </section>
            ) : (
              <>
                <div
                  aria-label="Meeting destination"
                  className="grid grid-cols-2 rounded-md bg-ff-muted-surface p-1"
                  role="tablist"
                >
                  {(["existing", "new"] as const).map((option) => (
                    <button
                      aria-selected={workflow === option}
                      className={`h-8 rounded text-[12px] font-semibold transition-colors ${
                        workflow === option
                          ? "bg-white text-ff-primary shadow-sm"
                          : "text-ff-muted hover:text-ff-text"
                      }`}
                      key={option}
                      onClick={() => {
                        setWorkflow(option);
                        setError(null);
                        setMeetingErrors({});
                        setShowMeetingValidation(false);
                      }}
                      role="tab"
                      type="button"
                    >
                      {option === "existing" ? "Existing meeting" : "New meeting"}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  {workflow === "existing" ? (
                    <MeetingSelector
                      onSelect={(meetingId) => {
                        setSelectedMeetingId(meetingId);
                        setError(null);
                      }}
                      selectedMeetingId={selectedMeetingId}
                      showValidation={showMeetingValidation}
                    />
                  ) : (
                    <NewMeetingForm
                      draft={meetingDraft}
                      errors={meetingErrors}
                      onChange={(nextDraft) => {
                        setMeetingDraft(nextDraft);
                        setMeetingErrors({});
                      }}
                    />
                  )}
                </div>

                {source.kind === "file" ? (
                  <section className="mt-4" aria-labelledby="selected-file-heading">
                    <h3
                      className="text-[11px] font-semibold text-ff-text"
                      id="selected-file-heading"
                    >
                      Selected file
                    </h3>
                    <div className="mt-2 flex items-center gap-3 rounded-md border border-ff-border bg-ff-muted-surface px-3 py-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded bg-ff-primary-soft text-ff-primary">
                        <Icon name="upload" size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-ff-text">
                          {source.file.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-ff-muted">
                          {fileDetails?.extension} · {fileDetails?.size}
                        </span>
                      </span>
                    </div>
                  </section>
                ) : (
                  <label className="mt-4 block text-[11px] font-semibold text-ff-text">
                    Transcript
                    <textarea
                      aria-invalid={Boolean(pasteError)}
                      className="mt-1.5 min-h-32 w-full resize-y rounded-md border border-ff-border px-3 py-2 text-[12px] font-normal leading-5 text-ff-text outline-none placeholder:text-[#98a1b3] focus:border-ff-primary focus:ring-1 focus:ring-ff-primary"
                      onChange={(event) => {
                        setPasteContent(event.target.value);
                        setPasteError(null);
                      }}
                      placeholder={
                        "[00:00] Amara Voss: Welcome everyone.\n\n[00:15] Dev Malik: Let's review the implementation."
                      }
                      value={pasteContent}
                    />
                    <span className="mt-1 block font-normal text-ff-muted">
                      Supported timestamps: MM:SS or HH:MM:SS
                    </span>
                    {pasteError && (
                      <span className="mt-1 block font-medium text-ff-error">
                        {pasteError}
                      </span>
                    )}
                  </label>
                )}

                {error && (
                  <p
                    aria-live="polite"
                    className="mt-4 rounded-md border border-[#f2dada] bg-[#fffafa] px-3 py-2 text-[11px] font-medium leading-5 text-ff-error"
                  >
                    {error}
                  </p>
                )}
              </>
            )}
          </div>

          {conflictMeetingId === null && !(createdMeetingId !== null && error) && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-ff-border px-5 py-3.5">
              <button
                className="h-9 rounded-md border border-ff-border bg-white px-4 text-[12px] font-semibold text-ff-text transition-colors hover:bg-ff-muted-surface disabled:opacity-50"
                disabled={pendingStage !== null}
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-9 min-w-36 rounded-md bg-ff-primary px-4 text-[12px] font-semibold text-white transition-colors hover:bg-ff-primary-hover disabled:cursor-wait disabled:opacity-60"
                disabled={pendingStage !== null}
                type="submit"
              >
                {primaryLabel}
              </button>
            </div>
          )}
        </form>
      </>
    </Dialog>
  );
}
