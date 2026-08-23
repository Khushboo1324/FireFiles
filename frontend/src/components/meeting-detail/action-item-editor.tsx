"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { ParticipantAvatar } from "@/components/meeting-detail/participant-avatar";
import { Icon } from "@/components/ui/icon";
import type {
  ActionItemCreate,
  ActionItemUpdate,
} from "@/lib/api/action-items";
import { ApiError } from "@/lib/api/client";
import type { ActionItem, Participant } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/formatters/meeting";
import { parseMeetingTimestamp } from "@/lib/meeting-time";

interface EditorErrors {
  text?: string;
  timestamp?: string;
}

type ActionItemEditorProps = {
  durationSeconds: number;
  initialItem?: ActionItem;
  onCancel: () => void;
  onFailure: (message: string) => void;
  onSubmit: (input: ActionItemCreate | ActionItemUpdate) => Promise<void>;
  participants: Participant[];
};

function fieldClass(hasError: boolean): string {
  return `mt-1 h-8 w-full rounded-[5px] border bg-white px-2.5 text-[11px] text-ff-text outline-none transition focus:ring-1 ${
    hasError
      ? "border-ff-error focus:border-ff-error focus:ring-ff-error"
      : "border-ff-border focus:border-ff-primary focus:ring-ff-primary"
  }`;
}

export function ActionItemEditor({
  durationSeconds,
  initialItem,
  onCancel,
  onFailure,
  onSubmit,
  participants,
}: ActionItemEditorProps) {
  const textInputRef = useRef<HTMLInputElement>(null);
  const initialTimestamp =
    initialItem?.timestamp_ms === null || initialItem === undefined
      ? ""
      : formatTimestamp(initialItem.timestamp_ms);
  const [text, setText] = useState(initialItem?.text ?? "");
  const [assigneeId, setAssigneeId] = useState(
    initialItem?.assignee ? String(initialItem.assignee.id) : "",
  );
  const [timestamp, setTimestamp] = useState(initialTimestamp);
  const [errors, setErrors] = useState<EditorErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = initialItem !== undefined;

  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  function validate(): { assignee: number | null; timestampMs: number | null } | null {
    const nextErrors: EditorErrors = {};
    const normalizedText = text.trim();
    let timestampMs: number | null = null;

    if (!normalizedText) {
      nextErrors.text = "Task text is required.";
    }

    if (timestamp.trim()) {
      if (initialItem && timestamp === initialTimestamp) {
        // Preserve backend millisecond precision when the seconds-only UI value
        // has not changed (for example, 1,250 ms displays as 00:01).
        timestampMs = initialItem.timestamp_ms;
      } else {
        timestampMs = parseMeetingTimestamp(timestamp);
        if (timestampMs === null) {
          nextErrors.timestamp =
            "Use MM:SS or HH:MM:SS with valid clock values.";
        } else if (timestampMs > durationSeconds * 1000) {
          nextErrors.timestamp = "Timestamp cannot exceed the meeting duration.";
        }
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      assignee: assigneeId ? Number(assigneeId) : null,
      timestampMs,
    };
  }

  function buildSubmission(
    assignee: number | null,
    timestampMs: number | null,
  ): ActionItemCreate | ActionItemUpdate {
    const normalizedText = text.trim();
    if (!initialItem) {
      const input: ActionItemCreate = { text: normalizedText };
      if (assignee !== null) {
        input.assignee_id = assignee;
      }
      if (timestampMs !== null) {
        input.timestamp_ms = timestampMs;
      }
      return input;
    }

    const patch: ActionItemUpdate = {};
    if (normalizedText !== initialItem.text) {
      patch.text = normalizedText;
    }
    if (assignee !== (initialItem.assignee?.id ?? null)) {
      // A changed blank selection is an intentional nullable clear, not omission.
      patch.assignee_id = assignee;
    }
    if (timestampMs !== initialItem.timestamp_ms) {
      patch.timestamp_ms = timestampMs;
    }
    return patch;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setRequestError(null);
    const validated = validate();
    if (!validated) {
      return;
    }

    const input = buildSubmission(validated.assignee, validated.timestampMs);
    if (isEditing && Object.keys(input).length === 0) {
      onCancel();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(input);
    } catch (error: unknown) {
      const message =
        error instanceof ApiError && error.status === 409
          ? "Assignee must be a participant in this meeting."
          : isEditing
            ? "Couldn't update action item."
            : "Couldn't add action item.";
      setRequestError(message);
      if (!(error instanceof ApiError && error.status === 409)) {
        onFailure(message);
      }
      setIsSubmitting(false);
    }
  }

  const timestampDescriptionId = `${isEditing ? `edit-${initialItem.id}` : "create"}-timestamp-description`;

  return (
    <form
      className="rounded-md border border-[#ded4ef] bg-[#fbf9ff] p-3"
      noValidate
      onKeyDown={(event) => {
        if (event.key === "Escape" && !isSubmitting) {
          event.preventDefault();
          onCancel();
        }
      }}
      onSubmit={handleSubmit}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-[#3f3652]">
          {isEditing ? "Edit action item" : "New action item"}
        </p>
        <button
          aria-label={`Cancel ${isEditing ? "editing" : "adding"} action item`}
          className="flex size-6 items-center justify-center rounded text-ff-muted hover:bg-white hover:text-ff-text disabled:opacity-50"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          <Icon name="close" size={13} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(140px,0.45fr)_minmax(110px,0.35fr)] gap-2.5 max-[620px]:grid-cols-1">
        <label className="text-[10px] font-semibold text-[#4c566b]">
          Task text
          <input
            aria-describedby={errors.text ? "action-item-text-error" : undefined}
            aria-invalid={Boolean(errors.text)}
            className={fieldClass(Boolean(errors.text))}
            disabled={isSubmitting}
            onChange={(event) => {
              setText(event.target.value);
              setErrors((current) => ({ ...current, text: undefined }));
              setRequestError(null);
            }}
            placeholder="What needs to be done?"
            ref={textInputRef}
            type="text"
            value={text}
          />
          {errors.text && (
            <span
              className="mt-1 block font-normal text-ff-error"
              id="action-item-text-error"
            >
              {errors.text}
            </span>
          )}
        </label>

        <label className="text-[10px] font-semibold text-[#4c566b]">
          Assignee
          <select
            className={fieldClass(false)}
            disabled={isSubmitting}
            onChange={(event) => {
              setAssigneeId(event.target.value);
              setRequestError(null);
            }}
            value={assigneeId}
          >
            <option value="">Unassigned</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-semibold text-[#4c566b]">
          Timestamp
          <input
            aria-describedby={`${timestampDescriptionId}${errors.timestamp ? " action-item-timestamp-error" : ""}`}
            aria-invalid={Boolean(errors.timestamp)}
            className={fieldClass(Boolean(errors.timestamp))}
            disabled={isSubmitting}
            inputMode="numeric"
            onChange={(event) => {
              setTimestamp(event.target.value);
              setErrors((current) => ({ ...current, timestamp: undefined }));
              setRequestError(null);
            }}
            placeholder="MM:SS"
            type="text"
            value={timestamp}
          />
          <span className="sr-only" id={timestampDescriptionId}>
            Optional. Enter MM:SS or HH:MM:SS, or leave blank.
          </span>
          {errors.timestamp && (
            <span
              className="mt-1 block font-normal text-ff-error"
              id="action-item-timestamp-error"
            >
              {errors.timestamp}
            </span>
          )}
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {assigneeId && (
            <span className="flex items-center gap-1.5 text-[10px] text-ff-muted">
              {(() => {
                const participant = participants.find(
                  (candidate) => candidate.id === Number(assigneeId),
                );
                return participant ? (
                  <>
                    <ParticipantAvatar participant={participant} size="small" />
                    <span className="truncate">{participant.name}</span>
                  </>
                ) : null;
              })()}
            </span>
          )}
          {requestError && (
            <p className="text-[10px] font-medium text-ff-error" role="alert">
              {requestError}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="h-8 rounded-[5px] border border-ff-border bg-white px-3 text-[11px] font-semibold text-ff-text hover:bg-ff-muted-surface disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-8 min-w-20 rounded-[5px] bg-ff-primary px-3 text-[11px] font-semibold text-white hover:bg-ff-primary-hover disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Adding..."
              : isEditing
                ? "Save"
                : "Add"}
          </button>
        </div>
      </div>
    </form>
  );
}
