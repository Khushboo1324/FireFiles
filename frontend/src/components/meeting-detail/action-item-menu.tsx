"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";

export function ActionItemMenu({
  disabled,
  itemText,
  onDelete,
  onEdit,
}: {
  disabled: boolean;
  itemText: string;
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

  function selectAction(action: () => void, opensDialog = false) {
    if (opensDialog) {
      triggerRef.current?.setAttribute("data-dialog-return-focus", "true");
    }
    setIsOpen(false);
    action();
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`More actions for ${itemText}`}
        className="flex size-6 items-center justify-center rounded text-ff-muted transition-colors hover:bg-ff-muted-surface hover:text-ff-text disabled:cursor-wait disabled:opacity-45"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <Icon name="more-horizontal" size={15} />
      </button>

      {isOpen && (
        <div
          aria-label={`Actions for ${itemText}`}
          className="absolute right-0 top-7 z-40 w-28 rounded-md border border-ff-border bg-white p-1 shadow-[0_7px_20px_rgba(31,26,41,0.14)]"
          role="menu"
        >
          <button
            className="flex h-8 w-full items-center rounded px-2 text-left text-[11px] font-medium text-ff-text hover:bg-ff-muted-surface"
            onClick={() => selectAction(onEdit)}
            role="menuitem"
            type="button"
          >
            Edit
          </button>
          <button
            className="flex h-8 w-full items-center rounded px-2 text-left text-[11px] font-medium text-ff-error hover:bg-[#fff1f1]"
            onClick={() => selectAction(onDelete, true)}
            role="menuitem"
            type="button"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
