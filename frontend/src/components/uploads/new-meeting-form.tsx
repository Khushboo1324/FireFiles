"use client";

import { Icon } from "@/components/ui/icon";

export interface ParticipantDraft {
  name: string;
  email: string;
  isOrganizer: boolean;
}

export interface NewMeetingDraft {
  title: string;
  meetingDate: string;
  durationMinutes: string;
  participants: ParticipantDraft[];
}

export interface NewMeetingValidation {
  title?: string;
  meetingDate?: string;
  duration?: string;
  participants?: string;
}

export function NewMeetingForm({
  draft,
  errors,
  onChange,
}: {
  draft: NewMeetingDraft;
  errors: NewMeetingValidation;
  onChange: (draft: NewMeetingDraft) => void;
}) {
  function updateParticipant(
    index: number,
    update: Partial<ParticipantDraft>,
  ) {
    onChange({
      ...draft,
      participants: draft.participants.map((participant, participantIndex) =>
        participantIndex === index ? { ...participant, ...update } : participant,
      ),
    });
  }

  return (
    <section aria-labelledby="new-meeting-heading">
      <h3 className="sr-only" id="new-meeting-heading">
        New meeting details
      </h3>
      <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(130px,1fr)] gap-3">
        <label className="text-[11px] font-semibold text-ff-text">
          Meeting title
          <input
            aria-invalid={Boolean(errors.title)}
            className="mt-1 h-9 w-full rounded-md border border-ff-border px-3 text-[12px] font-normal outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary"
            maxLength={255}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            placeholder="e.g. Product kickoff"
            type="text"
            value={draft.title}
          />
          {errors.title && (
            <span className="mt-1 block font-normal text-ff-error">{errors.title}</span>
          )}
        </label>
        <label className="text-[11px] font-semibold text-ff-text">
          Duration (minutes)
          <input
            aria-invalid={Boolean(errors.duration)}
            className="mt-1 h-9 w-full rounded-md border border-ff-border px-3 text-[12px] font-normal outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary"
            min="1"
            onChange={(event) =>
              onChange({ ...draft, durationMinutes: event.target.value })
            }
            step="1"
            type="number"
            value={draft.durationMinutes}
          />
          {errors.duration && (
            <span className="mt-1 block font-normal text-ff-error">
              {errors.duration}
            </span>
          )}
        </label>
      </div>

      <label className="mt-3 block text-[11px] font-semibold text-ff-text">
        Meeting date and time
        <input
          aria-invalid={Boolean(errors.meetingDate)}
          className="mt-1 h-9 w-full rounded-md border border-ff-border px-3 text-[12px] font-normal outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary"
          onChange={(event) =>
            onChange({ ...draft, meetingDate: event.target.value })
          }
          type="datetime-local"
          value={draft.meetingDate}
        />
        {errors.meetingDate && (
          <span className="mt-1 block font-normal text-ff-error">
            {errors.meetingDate}
          </span>
        )}
      </label>

      <div className="mt-4 flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-ff-text">Participants</h4>
        <button
          className="flex items-center gap-1 text-[11px] font-semibold text-ff-primary hover:underline"
          onClick={() =>
            onChange({
              ...draft,
              participants: [
                ...draft.participants,
                { name: "", email: "", isOrganizer: false },
              ],
            })
          }
          type="button"
        >
          <Icon name="plus" size={13} />
          Add participant
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {draft.participants.map((participant, index) => (
          <div
            className="grid grid-cols-[minmax(105px,1fr)_minmax(135px,1.25fr)_auto_auto] items-center gap-2 rounded-md border border-ff-border bg-ff-muted-surface p-2"
            key={index}
          >
            <label>
              <span className="sr-only">Participant {index + 1} name</span>
              <input
                aria-label={`Participant ${index + 1} name`}
                className="h-8 w-full rounded border border-ff-border bg-white px-2 text-[11px] outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary"
                maxLength={255}
                onChange={(event) =>
                  updateParticipant(index, { name: event.target.value })
                }
                placeholder="Name"
                type="text"
                value={participant.name}
              />
            </label>
            <label>
              <span className="sr-only">Participant {index + 1} email</span>
              <input
                aria-label={`Participant ${index + 1} email (optional)`}
                className="h-8 w-full rounded border border-ff-border bg-white px-2 text-[11px] outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary"
                maxLength={320}
                onChange={(event) =>
                  updateParticipant(index, { email: event.target.value })
                }
                placeholder="Email (optional)"
                type="email"
                value={participant.email}
              />
            </label>
            <label className="flex items-center gap-1.5 whitespace-nowrap text-[10px] text-ff-muted">
              <input
                checked={participant.isOrganizer}
                className="accent-[#630ed4]"
                onChange={(event) =>
                  updateParticipant(index, {
                    isOrganizer: event.target.checked,
                  })
                }
                type="checkbox"
              />
              Organizer
            </label>
            <button
              aria-label={`Remove participant ${index + 1}`}
              className="flex size-7 items-center justify-center rounded text-ff-muted hover:bg-white hover:text-ff-error disabled:cursor-not-allowed disabled:opacity-40"
              disabled={draft.participants.length === 1}
              onClick={() =>
                onChange({
                  ...draft,
                  participants: draft.participants.filter(
                    (_, participantIndex) => participantIndex !== index,
                  ),
                })
              }
              type="button"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
      {errors.participants && (
        <p className="mt-1.5 text-[11px] font-medium text-ff-error">
          {errors.participants}
        </p>
      )}
    </section>
  );
}
