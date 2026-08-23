import { Icon } from "@/components/ui/icon";

export function MeetingsSidebar() {
  return (
    <aside className="meetings-secondary-sidebar flex h-full min-h-0 flex-col border-r border-ff-border bg-ff-subtle">
      <div className="flex h-14 shrink-0 items-center border-b border-ff-border px-3">
        <div className="relative w-full">
          <Icon
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98a1b3]"
            name="search"
            size={15}
          />
          <input
            aria-label="Search channels"
            className="h-8 w-full rounded-[5px] border border-transparent bg-transparent pl-8 pr-2 text-[12px] text-ff-text placeholder:text-[#98a1b3] disabled:opacity-100"
            disabled
            placeholder="Search channels"
            title="Channel search — available in an upcoming step"
            type="search"
          />
        </div>
      </div>

      <nav aria-label="Meeting library" className="flex flex-col gap-1 px-2 pt-4">
        <button
          aria-current="page"
          className="flex h-9 items-center gap-2.5 rounded-md bg-ff-primary-soft px-3 text-left text-[13px] font-semibold text-ff-primary disabled:opacity-100"
          disabled
          type="button"
        >
          <Icon name="hash" size={17} />
          <span>My Meetings</span>
        </button>
        <button
          className="flex h-9 items-center gap-2.5 rounded-md px-3 text-left text-[13px] font-medium text-ff-muted disabled:opacity-100"
          disabled
          title="All Meetings — available in an upcoming step"
          type="button"
        >
          <Icon name="video-library" size={17} />
          <span>All Meetings</span>
        </button>
        <button
          className="flex h-9 items-center gap-2.5 rounded-md px-3 text-left text-[13px] font-medium text-ff-muted disabled:opacity-100"
          disabled
          title="Voice Agent Meetings — available in an upcoming step"
          type="button"
        >
          <Icon name="smart-toy" size={17} />
          <span>Voice Agent Meetings</span>
        </button>
      </nav>

      <div className="my-4 h-px bg-ff-border" />

      <section aria-labelledby="channels-heading" className="flex-1 px-3">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-[12px] font-semibold text-ff-text"
            id="channels-heading"
          >
            All channels
          </h2>
          <button
            aria-label="Add channel"
            className="flex size-6 items-center justify-center rounded text-ff-muted disabled:opacity-100"
            disabled
            title="Add channel — available in an upcoming step"
            type="button"
          >
            <Icon name="plus" size={15} />
          </button>
        </div>

        <div className="px-2 py-3 text-center">
          <Icon className="mx-auto mb-3 text-[#ef80cf]" name="hash" size={21} />
          <p className="text-[12px] leading-[17px] text-ff-text">
            Create channels to organize your conversations
          </p>
          <button
            className="mx-auto mt-3 flex h-8 items-center justify-center gap-1 rounded-[5px] border border-ff-border bg-white px-3 text-[12px] font-medium text-ff-text shadow-[0_1px_2px_rgba(25,28,29,0.05)] disabled:opacity-100"
            disabled
            title="Add channel — available in an upcoming step"
            type="button"
          >
            <Icon name="plus" size={14} />
            Channel
          </button>
        </div>
      </section>
    </aside>
  );
}
