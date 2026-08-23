"use client";

import { Icon } from "@/components/ui/icon";

interface AppHeaderSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  title?: string;
}

interface AppHeaderProps {
  title: string;
  search?: AppHeaderSearch;
}

export function AppHeader({ title, search }: AppHeaderProps) {
  return (
    <header className="app-header z-30 flex h-14 min-w-0 shrink-0 items-center justify-between border-b border-ff-border bg-ff-surface px-4">
      <div className="w-48 shrink-0 max-[760px]:w-28">
        <h1 className="text-[16px] font-semibold leading-6 text-ff-text">
          {title}
        </h1>
      </div>

      {search ? (
        <label className="relative mx-4 block min-w-0 max-w-md flex-grow">
          <span className="sr-only">
            {search.ariaLabel ?? search.placeholder ?? "Search"}
          </span>
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ff-muted"
            name="search"
            size={17}
          />
          <input
            className="h-8 w-full rounded-[5px] border border-ff-border bg-ff-muted-surface pl-9 pr-12 text-[13px] text-ff-text outline-none placeholder:text-[#98a1b3] transition-colors focus:border-ff-primary focus:bg-white focus:ring-1 focus:ring-ff-primary"
            disabled={search.disabled}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder}
            title={search.title}
            type="search"
            value={search.value}
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-ff-border-strong bg-ff-surface px-1 py-0.5 text-[10px] font-medium leading-none text-[#98a1b3]">
            ⌘K
          </kbd>
        </label>
      ) : (
        <div className="mx-4 min-w-0 max-w-md flex-grow" />
      )}

      <div className="flex shrink-0 items-center gap-4">
        <button
          className="flex h-8 items-center gap-1.5 rounded-[5px] border border-ff-border-strong bg-ff-surface px-3 text-[12px] font-medium text-ff-text shadow-[0_1px_2px_rgba(25,28,29,0.04)] transition-colors hover:bg-ff-muted-surface disabled:cursor-default disabled:opacity-100 max-[1280px]:hidden"
          disabled
          title="Demo placeholder"
          type="button"
        >
          <Icon name="auto-awesome" size={16} />
          Get AI credits
        </button>

        <button
          className="flex h-8 items-center gap-1 rounded-[5px] border border-ff-primary bg-[#fbf9ff] px-3 text-[12px] font-medium text-ff-primary transition-colors hover:bg-ff-primary-soft disabled:cursor-default disabled:opacity-100 max-[1040px]:hidden"
          disabled
          title="Demo placeholder"
          type="button"
        >
          <Icon name="person-add" size={16} />
          Invite
        </button>

        <div className="flex h-8 overflow-hidden rounded-[5px]">
          <button
            className="flex h-8 items-center gap-1 border-r border-white/25 bg-ff-primary px-3 text-[12px] font-semibold text-white transition-colors hover:bg-ff-primary-hover disabled:cursor-default disabled:opacity-100"
            disabled
            title="Demo placeholder"
            type="button"
          >
            <Icon name="video-camera" size={16} />
            Capture
          </button>
          <button
            aria-label="Capture options"
            className="flex h-8 w-8 items-center justify-center bg-ff-primary text-white transition-colors hover:bg-ff-primary-hover disabled:cursor-default disabled:opacity-100"
            disabled
            title="Demo placeholder"
            type="button"
          >
            <Icon name="chevron-down" size={17} />
          </button>
        </div>

        <div className="ml-0.5 flex items-center gap-2 border-l border-ff-border pl-4">
          <button
            aria-label="Microphone"
            className="flex size-8 items-center justify-center rounded-full text-ff-primary transition-colors hover:bg-ff-muted-surface disabled:cursor-default disabled:opacity-100"
            disabled
            title="Demo placeholder"
            type="button"
          >
            <Icon name="mic" size={19} />
          </button>
          <button
            aria-label="Notifications"
            className="relative flex size-8 items-center justify-center rounded-full text-ff-muted transition-colors hover:bg-ff-muted-surface disabled:cursor-default disabled:opacity-100"
            disabled
            title="Demo placeholder"
            type="button"
          >
            <Icon name="bell" size={19} />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-ff-error" />
          </button>
          <button
            aria-label="Demo user"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ff-avatar text-[12px] font-semibold text-white disabled:cursor-default disabled:opacity-100"
            disabled
            title="Demo user"
            type="button"
          >
            C
          </button>
        </div>
      </div>
    </header>
  );
}
