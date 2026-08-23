"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { deleteMeeting } from "@/lib/api/meetings";

export function DeleteMeetingDialog({
  meetingId,
  meetingTitle,
  onClose,
  onDeleted,
}: {
  meetingId: number;
  meetingTitle: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await deleteMeeting(meetingId);
      onDeleted();
    } catch {
      setError("Couldn't delete meeting.");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog
      ariaDescribedBy="delete-meeting-description"
      busy={isDeleting}
      maxWidthClass="max-w-[430px]"
      onClose={onClose}
      titleId="delete-meeting-title"
    >
      <div className="flex items-start gap-3 px-5 pb-3 pt-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff0f0] text-ff-error">
          <Icon name="close" size={17} />
        </span>
        <div className="min-w-0">
          <h2
            className="text-[15px] font-semibold text-[#202536]"
            id="delete-meeting-title"
          >
            Delete meeting?
          </h2>
          <p
            className="mt-1 text-[12px] font-medium text-ff-text"
            id="delete-meeting-description"
          >
            Delete &ldquo;{meetingTitle}&rdquo;?
          </p>
          <p className="mt-2 text-[11px] leading-5 text-ff-muted">
            This will permanently remove the meeting and its transcript, summary,
            action items, topics and chapters.
          </p>
        </div>
      </div>

      {error && (
        <p
          aria-live="assertive"
          className="mx-5 rounded-md border border-[#f2dada] bg-[#fffafa] px-3 py-2 text-[11px] font-medium text-ff-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-ff-border px-5 py-3.5">
        <button
          className="h-9 rounded-md border border-ff-border bg-white px-4 text-[12px] font-semibold text-ff-text hover:bg-ff-muted-surface disabled:opacity-50"
          data-autofocus
          disabled={isDeleting}
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className="h-9 min-w-28 rounded-md bg-ff-error px-4 text-[12px] font-semibold text-white hover:bg-[#dc2626] disabled:cursor-wait disabled:opacity-60"
          disabled={isDeleting}
          onClick={confirmDelete}
          type="button"
        >
          {isDeleting ? "Deleting..." : "Delete Meeting"}
        </button>
      </div>
    </Dialog>
  );
}
