"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { deleteActionItem } from "@/lib/api/action-items";
import type { ActionItem } from "@/lib/api/types";

export function DeleteActionItemDialog({
  item,
  onClose,
  onDeleted,
  onFailure,
}: {
  item: ActionItem;
  onClose: () => void;
  onDeleted: (itemId: number) => void;
  onFailure: (message: string) => void;
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
      await deleteActionItem(item.id);
      onDeleted(item.id);
    } catch {
      const message = "Couldn't delete action item.";
      setError(message);
      onFailure(message);
      setIsDeleting(false);
    }
  }

  return (
    <Dialog
      ariaDescribedBy="delete-action-item-description"
      busy={isDeleting}
      maxWidthClass="max-w-[430px]"
      onClose={onClose}
      titleId="delete-action-item-title"
    >
      <div className="flex items-start gap-3 px-5 pb-3 pt-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff0f0] text-ff-error">
          <Icon name="close" size={17} />
        </span>
        <div className="min-w-0">
          <h2
            className="text-[15px] font-semibold text-[#202536]"
            id="delete-action-item-title"
          >
            Delete action item?
          </h2>
          <p
            className="mt-2 line-clamp-3 break-words text-[12px] leading-5 text-ff-text"
            id="delete-action-item-description"
          >
            &ldquo;{item.text}&rdquo;
          </p>
          <p className="mt-2 text-[11px] leading-5 text-ff-muted">
            This action cannot be undone.
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
          className="h-9 min-w-24 rounded-md bg-ff-error px-4 text-[12px] font-semibold text-white hover:bg-[#dc2626] disabled:cursor-wait disabled:opacity-60"
          disabled={isDeleting}
          onClick={confirmDelete}
          type="button"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Dialog>
  );
}
