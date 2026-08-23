import { Icon, type IconName } from "@/components/ui/icon";

const tools: Array<{ icon: IconName; label: string; selected?: boolean }> = [
  { icon: "search", label: "Smart Search", selected: true },
  { icon: "equalizer", label: "Meeting insights" },
  { icon: "chat-bubble", label: "Meeting comments" },
  { icon: "bookmark", label: "Bookmarks" },
];

export function DetailToolRail() {
  return (
    <nav
      aria-label="Meeting tools"
      className="meeting-detail-tool-rail flex min-h-0 flex-col items-center border-r border-ff-border bg-white py-2"
    >
      <div className="flex w-full flex-col items-center gap-1.5">
        {tools.map((tool) => (
          <button
            aria-current={tool.selected ? "page" : undefined}
            aria-label={tool.label}
            className={`flex size-9 items-center justify-center rounded-md disabled:opacity-100 ${
              tool.selected
                ? "bg-ff-primary-soft text-ff-primary"
                : "text-[#68758b]"
            }`}
            disabled
            key={tool.label}
            title={tool.selected ? tool.label : `${tool.label} — coming soon`}
            type="button"
          >
            <Icon name={tool.icon} size={19} />
          </button>
        ))}
      </div>

      <button
        aria-label="Send feedback"
        className="mt-auto flex size-9 items-center justify-center rounded-md text-[#758196] disabled:opacity-100"
        disabled
        title="Feedback — coming soon"
        type="button"
      >
        <Icon name="smile" size={18} />
      </button>
    </nav>
  );
}
