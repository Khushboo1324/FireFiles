import { apiFetch } from "@/lib/api/client";
import type { ActionItem } from "@/lib/api/types";

export interface ActionItemUpdate {
  assignee_id?: number | null;
  completed?: boolean;
  text?: string;
  timestamp_ms?: number | null;
}

export function updateActionItem(
  actionItemId: number,
  update: ActionItemUpdate,
): Promise<ActionItem> {
  if (!Number.isSafeInteger(actionItemId) || actionItemId <= 0) {
    throw new RangeError("Action item id must be a positive integer.");
  }

  return apiFetch<ActionItem>(`/api/action-items/${actionItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
}
