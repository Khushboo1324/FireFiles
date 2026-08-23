"use client";

import { useState } from "react";

import { ActionItemEditor } from "@/components/meeting-detail/action-item-editor";
import { ActionItemMenu } from "@/components/meeting-detail/action-item-menu";
import { DeleteActionItemDialog } from "@/components/meeting-detail/delete-action-item-dialog";
import { ParticipantAvatar } from "@/components/meeting-detail/participant-avatar";
import { Icon } from "@/components/ui/icon";
import {
  createActionItem,
  updateActionItem,
  type ActionItemCreate,
  type ActionItemUpdate,
} from "@/lib/api/action-items";
import type { ActionItem, Participant } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/formatters/meeting";

interface ActionItemsSectionProps {
  durationSeconds: number;
  highlighted: boolean;
  items: ActionItem[];
  meetingId: number;
  onItemsChange: (update: (items: ActionItem[]) => ActionItem[]) => void;
  onNotify: (message: string, tone: "success" | "error") => void;
  onSeekToMs: (milliseconds: number) => void;
  participants: Participant[];
}

export function ActionItemsSection({
  durationSeconds,
  highlighted,
  items,
  meetingId,
  onItemsChange,
  onNotify,
  onSeekToMs,
  participants,
}: ActionItemsSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  async function toggleCompleted(item: ActionItem, completed: boolean) {
    if (pendingIds.has(item.id)) {
      return;
    }

    setPendingIds((current) => new Set(current).add(item.id));
    onItemsChange((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, completed } : candidate,
      ),
    );

    try {
      const updatedItem = await updateActionItem(item.id, { completed });
      onItemsChange((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? updatedItem : candidate,
        ),
      );
    } catch {
      onItemsChange((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? item : candidate,
        ),
      );
      onNotify("Couldn't update action item.", "error");
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  async function submitCreate(input: ActionItemCreate | ActionItemUpdate) {
    const createdItem = await createActionItem(
      meetingId,
      input as ActionItemCreate,
    );
    // The backend assigns the next sequence and returns the newly appended item.
    onItemsChange((current) => [...current, createdItem]);
    setIsCreating(false);
    onNotify("Action item added.", "success");
  }

  async function submitEdit(
    itemId: number,
    input: ActionItemCreate | ActionItemUpdate,
  ) {
    const updatedItem = await updateActionItem(
      itemId,
      input as ActionItemUpdate,
    );
    onItemsChange((current) =>
      current.map((item) => (item.id === itemId ? updatedItem : item)),
    );
    setEditingItemId(null);
    onNotify("Action item updated.", "success");
  }

  return (
    <section
      aria-labelledby="action-items-heading"
      className={`scroll-mt-6 rounded-md transition-[background-color,box-shadow] ${
        highlighted ? "bg-[#faf8ff] ring-2 ring-[#d9c9f6] ring-offset-4" : ""
      }`}
      id="action-items-section"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full bg-[#fff1dd] text-[#df8025]">
          <Icon name="check" size={13} />
        </span>
        <h2
          className="text-[13px] font-semibold text-[#252c3d]"
          id="action-items-heading"
        >
          Action Items
        </h2>
        <span className="text-[10px] text-ff-muted">{items.length}</span>
        <button
          aria-controls="action-item-create-editor"
          aria-expanded={isCreating}
          className="ml-auto flex h-7 items-center gap-1 rounded-[5px] border border-[#ded5ef] bg-white px-2.5 text-[10px] font-semibold text-[#6440b4] transition-colors hover:bg-[#f8f5ff] disabled:opacity-50"
          disabled={isCreating}
          onClick={() => {
            setEditingItemId(null);
            setIsCreating(true);
          }}
          type="button"
        >
          <Icon name="plus" size={13} />
          Add action item
        </button>
      </div>

      {isCreating && (
        <div className="mb-2" id="action-item-create-editor">
          <ActionItemEditor
            durationSeconds={durationSeconds}
            onCancel={() => setIsCreating(false)}
            onFailure={(message) => onNotify(message, "error")}
            onSubmit={submitCreate}
            participants={participants}
          />
        </div>
      )}

      {items.length > 0 ? (
        <div className="rounded-md border border-ff-border bg-white">
          {items.map((item) => {
            const isPending = pendingIds.has(item.id);
            const timestampMs = item.timestamp_ms;
            if (editingItemId === item.id) {
              return (
                <div
                  className="border-b border-ff-border-soft p-2 last:border-b-0"
                  key={item.id}
                >
                  <ActionItemEditor
                    durationSeconds={durationSeconds}
                    initialItem={item}
                    onCancel={() => setEditingItemId(null)}
                    onFailure={(message) => onNotify(message, "error")}
                    onSubmit={(input) => submitEdit(item.id, input)}
                    participants={participants}
                  />
                </div>
              );
            }

            return (
              <div
                className="relative flex items-start gap-2.5 border-b border-ff-border-soft px-3 py-3 last:border-b-0"
                key={item.id}
              >
                <input
                  aria-label={`${item.completed ? "Mark incomplete" : "Mark complete"}: ${item.text}`}
                  checked={item.completed}
                  className="mt-0.5 size-[17px] shrink-0 cursor-pointer accent-[#630ed4] disabled:cursor-wait disabled:opacity-55"
                  disabled={isPending}
                  onChange={(event) =>
                    void toggleCompleted(item, event.currentTarget.checked)
                  }
                  type="checkbox"
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[12px] leading-[18px] ${
                      item.completed
                        ? "text-[#8b93a3] line-through"
                        : "text-[#3d485f]"
                    }`}
                  >
                    {item.text}
                  </p>
                  {(item.assignee || timestampMs !== null || isPending) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-ff-muted">
                      {item.assignee && (
                        <span className="flex items-center gap-1.5">
                          <ParticipantAvatar
                            participant={item.assignee}
                            size="small"
                          />
                          {item.assignee.name}
                        </span>
                      )}
                      {timestampMs !== null && (
                        <button
                          aria-label={`Seek to ${formatTimestamp(timestampMs)}`}
                          className="rounded font-medium text-[#6d42d8] underline-offset-2 hover:underline"
                          onClick={() => onSeekToMs(timestampMs)}
                          type="button"
                        >
                          {formatTimestamp(timestampMs)}
                        </button>
                      )}
                      {isPending && (
                        <span className="text-[#8d75bd]">Saving...</span>
                      )}
                    </div>
                  )}
                </div>

                <ActionItemMenu
                  disabled={isPending}
                  itemText={item.text}
                  onDelete={() => setDeletingItem(item)}
                  onEdit={() => {
                    setIsCreating(false);
                    setEditingItemId(item.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-ff-border px-4 py-4 text-[12px] text-ff-muted">
          No action items yet.
        </p>
      )}

      {deletingItem && (
        <DeleteActionItemDialog
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={(itemId) => {
            onItemsChange((current) =>
              current.filter((item) => item.id !== itemId),
            );
            setDeletingItem(null);
            onNotify("Action item deleted.", "success");
          }}
          onFailure={(message) => onNotify(message, "error")}
        />
      )}
    </section>
  );
}
