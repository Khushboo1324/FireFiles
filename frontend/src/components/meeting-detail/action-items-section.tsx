import { useState } from "react";

import { ParticipantAvatar } from "@/components/meeting-detail/participant-avatar";
import { Icon } from "@/components/ui/icon";
import { updateActionItem } from "@/lib/api/action-items";
import type { ActionItem } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/formatters/meeting";

interface ActionItemsSectionProps {
  highlighted: boolean;
  items: ActionItem[];
}

export function ActionItemsSection({
  highlighted,
  items,
}: ActionItemsSectionProps) {
  const [currentItems, setCurrentItems] = useState(items);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function toggleCompleted(item: ActionItem, completed: boolean) {
    if (pendingIds.has(item.id)) {
      return;
    }

    setErrorMessage(null);
    setPendingIds((current) => new Set(current).add(item.id));
    setCurrentItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, completed } : candidate,
      ),
    );

    try {
      const updatedItem = await updateActionItem(item.id, { completed });
      setCurrentItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? updatedItem : candidate,
        ),
      );
    } catch {
      setCurrentItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? item : candidate,
        ),
      );
      setErrorMessage(
        "Couldn't update this action item. Your change was reverted.",
      );
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
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
        <span className="text-[10px] text-ff-muted">{currentItems.length}</span>
      </div>

      {errorMessage && (
        <div
          className="mb-3 rounded-[5px] border border-[#f3c8c8] bg-[#fff7f7] px-3 py-2 text-[10px] text-[#a33d3d]"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {currentItems.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-ff-border bg-white">
          {currentItems.map((item) => {
            const isPending = pendingIds.has(item.id);
            return (
              <div
                className="flex items-start gap-2.5 border-b border-ff-border-soft px-3 py-3 last:border-b-0"
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
                  {(item.assignee || item.timestamp_ms !== null || isPending) && (
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
                      {item.timestamp_ms !== null && (
                        <button
                          className="font-medium text-[#6d42d8] underline-offset-2 disabled:opacity-100"
                          disabled
                          title="Seeking will be added in a later step"
                          type="button"
                        >
                          {formatTimestamp(item.timestamp_ms)}
                        </button>
                      )}
                      {isPending && (
                        <span className="text-[#8d75bd]">Saving…</span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  aria-label="Action item options"
                  className="flex size-6 shrink-0 items-center justify-center rounded text-ff-muted disabled:opacity-100"
                  disabled
                  title="Action item editing — available in an upcoming step"
                  type="button"
                >
                  <Icon name="more-horizontal" size={15} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-ff-border px-4 py-4 text-[12px] text-ff-muted">
          No action items recorded.
        </p>
      )}
    </section>
  );
}
