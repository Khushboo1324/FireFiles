import { Icon } from "@/components/ui/icon";

const suggestions = ["My action items", "Key decisions", "Key initiatives"];

export function AskFireFilesPanel() {
  return (
    <aside
      aria-label="Ask FireFiles"
      className="ask-firefiles-panel flex h-full min-h-0 flex-col bg-ff-surface"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-ff-border px-4">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ff-text">
          <span className="flex size-7 items-center justify-center rounded-md border border-[#b992ff] bg-ff-primary-soft text-ff-primary">
            <Icon name="smart-toy" size={16} />
          </span>
          <span>Ask FireFiles</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Ask FireFiles history"
            className="flex size-8 items-center justify-center rounded-md text-ff-muted disabled:opacity-100"
            disabled
            title="History — coming soon"
            type="button"
          >
            <Icon name="history" size={17} />
          </button>
          <button
            aria-label="Open Ask FireFiles"
            className="flex size-8 items-center justify-center rounded-md text-ff-muted disabled:opacity-100"
            disabled
            title="Open Ask FireFiles — coming soon"
            type="button"
          >
            <Icon name="expand" size={16} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
        <div className="mt-24 px-2">
          <Icon className="mb-7 text-[#66dca5]" name="sparkles" size={27} />
          <h2 className="text-[17px] font-semibold leading-6 tracking-[-0.01em] text-[#344158]">
            Hi there!
            <span className="block">Get ready for your meeting</span>
          </h2>
          <p className="mt-2 max-w-[300px] text-[12px] leading-5 text-ff-muted">
            AI Q&amp;A is a demo placeholder and is not connected to a model.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-start gap-3 px-2">
          {suggestions.map((suggestion) => (
            <button
              className="flex min-h-9 items-center rounded-lg bg-ff-muted-surface px-3 text-left text-[12px] text-[#465267] disabled:opacity-100"
              disabled
              key={suggestion}
              title={`${suggestion} — coming soon`}
              type="button"
            >
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-ff-border bg-white p-4">
        <div className="mb-2 w-max rounded-md border border-ff-border bg-ff-muted-surface px-2 py-1 text-[11px] font-medium text-ff-muted">
          # My Meetings
        </div>
        <div className="rounded-lg border border-ff-border bg-white p-2 shadow-[0_1px_2px_rgba(25,28,29,0.04)]">
          <textarea
            aria-label="Ask anything about your meetings"
            className="min-h-14 w-full resize-none border-0 bg-transparent px-1.5 py-1 text-[12px] text-ff-text outline-none placeholder:text-ff-muted disabled:opacity-100"
            disabled
            placeholder="Ask anything about your meetings..."
            rows={2}
            title="Ask FireFiles — coming soon"
          />
          <div className="mt-1 flex items-center justify-between border-t border-ff-border-soft pt-2">
            <div className="flex items-center gap-1">
              <button
                aria-label="Add context"
                className="flex size-7 items-center justify-center rounded text-ff-muted disabled:opacity-100"
                disabled
                title="Add context — coming soon"
                type="button"
              >
                <Icon name="plus" size={17} />
              </button>
              <button
                aria-label="Use microphone"
                className="flex size-7 items-center justify-center rounded text-ff-muted disabled:opacity-100"
                disabled
                title="Microphone — coming soon"
                type="button"
              >
                <Icon name="mic" size={16} />
              </button>
            </div>
            <button
              aria-label="Send message"
              className="flex size-8 items-center justify-center rounded-lg bg-ff-primary text-white disabled:opacity-100"
              disabled
              title="Send — coming soon"
              type="button"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
