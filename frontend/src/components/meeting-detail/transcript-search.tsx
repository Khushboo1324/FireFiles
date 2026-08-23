import type { KeyboardEvent } from "react";

import { Icon } from "@/components/ui/icon";

interface TranscriptSearchProps {
  currentMatch: number;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  query: string;
  totalMatches: number;
}

export function TranscriptSearch({
  currentMatch,
  onChange,
  onNext,
  onPrevious,
  query,
  totalMatches,
}: TranscriptSearchProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onChange("");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) {
        onPrevious();
      } else {
        onNext();
      }
    }
  }

  return (
    <label className="relative block">
      <span className="sr-only">Find in transcript</span>
      <Icon
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#929bad]"
        name="search"
        size={15}
      />
      <input
        className="h-8 w-full rounded-[5px] border border-ff-border bg-[#fafbfc] pl-8 pr-[104px] text-[11px] text-ff-text outline-none placeholder:text-[#9aa3b5] focus:border-ff-primary focus:bg-white focus:ring-1 focus:ring-ff-primary"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in transcript"
        type="search"
        value={query}
      />
      <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[#778196]">
        <span aria-live="polite" className="min-w-10 text-center text-[9px]">
          {currentMatch} / {totalMatches}
        </span>
        <button
          aria-label="Previous transcript match"
          className="flex size-5 items-center justify-center rounded hover:bg-ff-muted-surface disabled:cursor-default disabled:opacity-35"
          disabled={totalMatches === 0}
          onClick={onPrevious}
          type="button"
        >
          <Icon className="rotate-180" name="chevron-down" size={12} />
        </button>
        <button
          aria-label="Next transcript match"
          className="flex size-5 items-center justify-center rounded hover:bg-ff-muted-surface disabled:cursor-default disabled:opacity-35"
          disabled={totalMatches === 0}
          onClick={onNext}
          type="button"
        >
          <Icon name="chevron-down" size={12} />
        </button>
      </span>
    </label>
  );
}
