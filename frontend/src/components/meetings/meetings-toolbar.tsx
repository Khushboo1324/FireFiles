import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import type { MeetingSort } from "@/lib/api/meetings";

interface MeetingsToolbarProps {
  participant: string;
  dateFrom: string;
  dateTo: string;
  sort: MeetingSort;
  participantOptions: string[];
  onParticipantChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSortChange: (value: MeetingSort) => void;
  onClearFilters: () => void;
}

export function MeetingsToolbar({
  participant,
  dateFrom,
  dateTo,
  sort,
  participantOptions,
  onParticipantChange,
  onDateFromChange,
  onDateToChange,
  onSortChange,
  onClearFilters,
}: MeetingsToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const activeFilterCount =
    Number(Boolean(participant)) +
    Number(Boolean(dateFrom)) +
    Number(Boolean(dateTo)) +
    Number(sort !== "newest");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !popoverRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative z-10 flex min-h-[58px] shrink-0 items-center justify-between border-b border-ff-border bg-white px-4 py-2.5">
      <div
        aria-label="Meeting ownership"
        className="flex bg-ff-muted-surface p-1"
        role="group"
      >
        <button
          aria-pressed="true"
          className="h-7  border-ff-border bg-white px-3 text-[11px] font-semibold text-ff-text  disabled:opacity-100"
          disabled
          title="Hosted by me — demo view"
          type="button"
        >
          Hosted by me
        </button>
        <button
          aria-pressed="false"
          className="h-7 rounded-md px-3 text-[11px] font-medium text-ff-muted disabled:opacity-100"
          disabled
          title="Shared with me — available in an upcoming step"
          type="button"
        >
          Shared with me
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={popoverRef}>
        <button
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`flex h-8 items-center gap-2 rounded-md border px-3 text-[11px] font-semibold transition-colors ${
            isOpen || activeFilterCount > 0
              ? "border-ff-primary/30 bg-ff-primary-soft text-ff-primary"
              : "border-ff-border bg-white text-ff-muted hover:bg-ff-subtle hover:text-ff-text"
          }`}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <Icon name="filter" size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-ff-primary text-[9px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

          {isOpen && (
          <div
            aria-label="Meeting filters"
            className="absolute right-0 top-10 z-30 w-[300px] rounded-lg border border-ff-border bg-white p-3 shadow-[0_10px_30px_rgba(31,26,41,0.12)]"
            role="dialog"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[12px] font-semibold text-ff-text">Filters</h2>
              <button
                aria-label="Close filters"
                className="flex size-7 items-center justify-center rounded-md text-ff-muted hover:bg-ff-muted-surface"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <Icon name="close" size={15} />
              </button>
            </div>

            <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ff-muted">
              Participant
              <select
                className="mt-1.5 h-8 w-full rounded-md border border-ff-border bg-white px-2 text-[12px] font-normal normal-case tracking-normal text-ff-text outline-none transition focus:border-ff-primary focus:ring-2 focus:ring-ff-primary-soft"
                onChange={(event) => onParticipantChange(event.target.value)}
                value={participant}
              >
                <option value="">All participants</option>
                {participantOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ff-muted">
                Date from
                <input
                  className="mt-1.5 h-8 w-full rounded-md border border-ff-border bg-white px-2 text-[11px] font-normal normal-case tracking-normal text-ff-text outline-none transition focus:border-ff-primary focus:ring-2 focus:ring-ff-primary-soft"
                  max={dateTo || undefined}
                  onChange={(event) => onDateFromChange(event.target.value)}
                  type="date"
                  value={dateFrom}
                />
              </label>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ff-muted">
                Date to
                <input
                  className="mt-1.5 h-8 w-full rounded-md border border-ff-border bg-white px-2 text-[11px] font-normal normal-case tracking-normal text-ff-text outline-none transition focus:border-ff-primary focus:ring-2 focus:ring-ff-primary-soft"
                  min={dateFrom || undefined}
                  onChange={(event) => onDateToChange(event.target.value)}
                  type="date"
                  value={dateTo}
                />
              </label>
            </div>

            <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ff-muted">
              Sort
              <select
                className="mt-1.5 h-8 w-full rounded-md border border-ff-border bg-white px-2 text-[12px] font-normal normal-case tracking-normal text-ff-text outline-none transition focus:border-ff-primary focus:ring-2 focus:ring-ff-primary-soft"
                onChange={(event) =>
                  onSortChange(event.target.value as MeetingSort)
                }
                value={sort}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </label>

            <button
              className="mt-3 h-7 text-[11px] font-semibold text-ff-primary disabled:cursor-default disabled:text-ff-muted"
              disabled={activeFilterCount === 0}
              onClick={onClearFilters}
              type="button"
            >
              Clear filters
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
