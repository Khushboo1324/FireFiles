"use client";

import { useEffect, useEffectEvent, useRef } from "react";

interface DialogProps {
  ariaDescribedBy?: string;
  busy?: boolean;
  children: React.ReactNode;
  maxWidthClass?: string;
  onClose: () => void;
  titleId: string;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function Dialog({
  ariaDescribedBy,
  busy = false,
  children,
  maxWidthClass = "max-w-[620px]",
  onClose,
  titleId,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeDialog = useEffectEvent(onClose);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const returnFocus = document.querySelector<HTMLElement>(
      '[data-dialog-return-focus="true"]',
    );
    const dialog = dialogRef.current;
    const initialFocus =
      dialog?.querySelector<HTMLElement>("[data-autofocus]") ?? dialog;
    initialFocus?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      const currentDialog = dialogRef.current;
      if (!currentDialog) {
        return;
      }

      if (event.key === "Escape" && currentDialog.dataset.busy !== "true") {
        event.preventDefault();
        closeDialog();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(
        currentDialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        currentDialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      } else if (returnFocus?.isConnected) {
        returnFocus.focus();
      }
      returnFocus?.removeAttribute("data-dialog-return-focus");
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#171324]/35 p-4 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        aria-describedby={ariaDescribedBy}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`flex max-h-[90dvh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-xl border border-ff-border bg-white shadow-[0_18px_55px_rgba(40,24,74,0.2)]`}
        data-busy={busy}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
