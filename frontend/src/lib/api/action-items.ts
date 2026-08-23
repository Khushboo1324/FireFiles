import { apiFetch } from "@/lib/api/client";
import type { ActionItem } from "@/lib/api/types";

export interface ActionItemCreate {
  assignee_id?: number | null;
  text: string;
  timestamp_ms?: number | null;
}

export interface ActionItemUpdate {
  assignee_id?: number | null;
  completed?: boolean;
  text?: string;
  timestamp_ms?: number | null;
}

function validatePositiveId(id: number, label: string): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
}

export function createActionItem(
  meetingId: number,
  input: ActionItemCreate,
): Promise<ActionItem> {
  validatePositiveId(meetingId, "Meeting id");

  return apiFetch<ActionItem>(`/api/meetings/${meetingId}/action-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateActionItem(
  actionItemId: number,
  update: ActionItemUpdate,
): Promise<ActionItem> {
  validatePositiveId(actionItemId, "Action item id");

  return apiFetch<ActionItem>(`/api/action-items/${actionItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
}

export function deleteActionItem(actionItemId: number): Promise<void> {
  validatePositiveId(actionItemId, "Action item id");

  return apiFetch<void>(`/api/action-items/${actionItemId}`, {
    method: "DELETE",
  });
}
