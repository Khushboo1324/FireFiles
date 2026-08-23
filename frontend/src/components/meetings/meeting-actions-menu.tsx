"use client";

import { useEffect, useRef, useState } from "react";

import { Icon, type IconName } from "@/components/ui/icon";

export function MeetingActionsMenu({
  icon = "more-vertical",
  meetingTitle,
  onDelete,
  onEdit,
}: {
  icon?: Extract<IconName, "more-horizontal" | "more-vertical">;
  meetingTitle: string;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectAction(action: () => void) {
    triggerRef.current?.setAttribute("data-dialog-return-focus", "true");
    setIsOpen(false);
    action();
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`More actions for ${meetingTitle}`}
        className="flex size-8 items-center justify-center rounded-md text-ff-muted transition-colors hover:bg-ff-muted-surface hover:text-ff-text"
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <Icon name={icon} size={18} />
      </button>

      {isOpen && (
        <div
          aria-label={`Actions for ${meetingTitle}`}
          className="absolute right-0 top-9 z-40 w-40 rounded-lg border border-ff-border bg-white p-1.5 shadow-[0_8px_24px_rgba(31,26,41,0.14)]"
          role="menu"
        >
          <button
            className="flex h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-medium text-ff-text hover:bg-ff-muted-surface"
            onClick={() => selectAction(onEdit)}
            role="menuitem"
            type="button"
          >
            Edit meeting
          </button>
          <button
            className="flex h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-medium text-ff-error hover:bg-[#fff1f1]"
            onClick={() => selectAction(onDelete)}
            role="menuitem"
            type="button"
          >
            Delete meeting
          </button>
        </div>
      )}
    </div>
  );
}
