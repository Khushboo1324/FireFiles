"use client";

import { useEffect, useEffectEvent } from "react";

import { Icon } from "@/components/ui/icon";

export type ToastTone = "success" | "error";

export interface ToastNotification {
  id: number;
  message: string;
  tone: ToastTone;
}

export function Toast({
  notification,
  onDismiss,
}: {
  notification: ToastNotification | null;
  onDismiss: () => void;
}) {
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = window.setTimeout(dismiss, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  if (!notification) {
    return null;
  }

  const isSuccess = notification.tone === "success";

  return (
    <div
      aria-atomic="true"
      aria-live={isSuccess ? "polite" : "assertive"}
      className="fixed bottom-24 right-6 z-[70] flex min-w-56 max-w-sm items-center gap-2 rounded-lg bg-[#242038] px-3 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_24px_rgba(24,20,40,0.22)]"
      role={isSuccess ? "status" : "alert"}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
          isSuccess ? "bg-[#55b987]" : "bg-ff-error"
        }`}
      >
        <Icon name={isSuccess ? "check" : "close"} size={12} />
      </span>
      <span className="flex-1">{notification.message}</span>
      <button
        aria-label="Dismiss notification"
        className="flex size-6 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
        onClick={onDismiss}
        type="button"
      >
        <Icon name="close" size={13} />
      </button>
    </div>
  );
}
