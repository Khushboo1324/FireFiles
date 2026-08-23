import { ParticipantAvatar } from "@/components/meeting-detail/participant-avatar";
import { Icon } from "@/components/ui/icon";
import type { Topic, TranscriptSegment } from "@/lib/api/types";
import {
  countSmartFilters,
  deriveSpeakerTalktime,
  type SmartFilter,
} from "@/lib/transcript/smart-filters";

const filterItems: Array<{
  color: string;
  id: SmartFilter;
  label: string;
}> = [
  { id: "questions", label: "Questions", color: "bg-[#ec8bd1]" },
  { id: "tasks", label: "Tasks", color: "bg-[#f9a86f]" },
  { id: "metrics", label: "Metrics", color: "bg-[#55cce5]" },
  { id: "date-time", label: "Date & Time", color: "bg-[#61d9c1]" },
];

const sentimentItems = [
  { label: "Neutral", color: "bg-[#d1a2de]" },
  { label: "Positive", color: "bg-[#59d3a6]" },
  { label: "Negative", color: "bg-[#f5aa72]" },
];

interface SmartSearchPanelProps {
  actionItemCount: number;
  activeFilter: SmartFilter | null;
  onActiveFilterChange: (filter: SmartFilter | null) => void;
  segments: TranscriptSegment[];
  topics: Topic[];
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between text-[#8994a8]">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em]">
        {children}
      </h3>
      <Icon name="chevron-down" size={14} />
    </div>
  );
}

export function SmartSearchPanel({
  actionItemCount,
  activeFilter,
  onActiveFilterChange,
  segments,
  topics,
}: SmartSearchPanelProps) {
  const counts = countSmartFilters(segments, actionItemCount);
  const speakerTalktime = deriveSpeakerTalktime(segments);
  const activeLabel = filterItems.find((item) => item.id === activeFilter)?.label;

  return (
    <aside className="meeting-smart-panel min-h-0 border-r border-ff-border bg-white">
      <div className="flex h-14 items-center justify-between border-b border-ff-border px-4">
        <h2 className="text-[13px] font-semibold text-ff-text">Smart Search</h2>
        <Icon className="text-ff-muted" name="search" size={17} />
      </div>

      <div className="h-[calc(100%-56px)] overflow-y-auto">
        <section className="border-b border-ff-border p-4">
          <SectionHeading>AI Filters</SectionHeading>
          <div className="grid grid-cols-2 gap-2">
            {filterItems.map((item) => {
              const isActive = activeFilter === item.id;
              return (
                <button
                  aria-pressed={isActive}
                  className={`flex h-10 min-w-0 items-center gap-2 rounded-[5px] border px-2.5 text-left text-[11px] transition-colors ${
                    isActive
                      ? "border-[#d9c9f6] bg-ff-primary-soft text-[#5f35b7]"
                      : "border-transparent bg-ff-muted-surface text-[#45516a] hover:border-ff-border"
                  }`}
                  key={item.id}
                  onClick={() =>
                    onActiveFilterChange(isActive ? null : item.id)
                  }
                  type="button"
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${item.color}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="shrink-0 text-[10px] text-[#8f99aa]">
                    {counts[item.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {activeFilter && (
            <div className="mt-3 flex items-center justify-between rounded-[5px] bg-[#faf8ff] px-2.5 py-2 text-[10px] text-[#6c568f]">
              <span>
                {activeFilter === "tasks"
                  ? `${actionItemCount} action items in this meeting`
                  : `${activeLabel} filter active`}
              </span>
              <button
                className="font-semibold text-ff-primary hover:underline"
                onClick={() => onActiveFilterChange(null)}
                type="button"
              >
                Clear
              </button>
            </div>
          )}
        </section>

        <section className="border-b border-ff-border p-4">
          <SectionHeading>Sentiments</SectionHeading>
          <div className="space-y-2">
            {sentimentItems.map((item) => (
              <div
                className="flex h-10 items-center justify-between rounded-[5px] bg-ff-muted-surface px-3 text-[11px] text-[#45516a]"
                key={item.label}
              >
                <span className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${item.color}`} />
                  {item.label}
                </span>
                <span className="text-[10px] text-[#99a2b3]">Not analyzed</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-ff-border p-4">
          <SectionHeading>Speaker Talktime</SectionHeading>
          {speakerTalktime.length > 0 ? (
            <div className="space-y-2">
              {speakerTalktime.map(({ participant, percentage }) => (
                <div
                  className="rounded-[5px] bg-ff-muted-surface px-2.5 py-2"
                  key={participant.id}
                >
                  <div className="flex items-center gap-2.5">
                    <ParticipantAvatar participant={participant} />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#45516a]">
                      {participant.name}
                    </span>
                    <span className="text-[10px] font-medium text-[#69758b]">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="ml-[42px] mt-1.5 h-1 overflow-hidden rounded-full bg-[#e2e5eb]">
                    <div
                      className="h-full rounded-full bg-[#7953e6]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-ff-muted">
              No known speaker duration available.
            </p>
          )}
        </section>

        <section className="p-4">
          <div className="mb-3 flex items-center justify-between text-[#8994a8]">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em]">
              Topic Trackers
            </h3>
            <button
              aria-label="Add topic tracker"
              className="flex size-6 items-center justify-center rounded disabled:opacity-100"
              disabled
              title="Add topic tracker — coming soon"
              type="button"
            >
              <Icon name="plus" size={15} />
            </button>
          </div>
          {topics.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <span
                  className="rounded-[5px] border border-[#e5def4] bg-[#f8f5ff] px-2.5 py-1.5 text-[10px] font-medium text-[#685194]"
                  key={topic.id}
                >
                  # {topic.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="py-5 text-center">
              <Icon className="mx-auto text-[#eea46d]" name="hash" size={18} />
              <p className="mt-2 text-[11px] text-ff-muted">
                No topics available.
              </p>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
