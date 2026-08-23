import type { Chapter } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/formatters/meeting";

export function ChaptersSection({ chapters }: { chapters: Chapter[] }) {
  return (
    <section aria-labelledby="chapters-heading">
      <div className="mb-3 flex items-baseline gap-2">
        <h2
          className="text-[13px] font-semibold text-[#252c3d]"
          id="chapters-heading"
        >
          Chapters
        </h2>
        <span className="text-[10px] text-ff-muted">{chapters.length}</span>
      </div>

      {chapters.length > 0 ? (
        <ol className="space-y-0 border-l border-[#ddd4f2]">
          {chapters.map((chapter) => (
            <li className="relative pb-5 pl-5 last:pb-0" key={chapter.id}>
              <span className="absolute -left-[4px] top-[6px] size-[7px] rounded-full bg-[#8a5de7] ring-4 ring-white" />
              <div className="flex flex-wrap items-baseline gap-2">
                <button
                  className="text-[11px] font-semibold text-[#6d42d8] underline-offset-2 disabled:opacity-100"
                  disabled
                  title="Seeking will be added in a later step"
                  type="button"
                >
                  {formatTimestamp(chapter.start_time_ms)}
                </button>
                <h3 className="text-[12px] font-semibold text-[#374157]">
                  {chapter.title}
                </h3>
                {chapter.end_time_ms !== null && (
                  <span className="text-[10px] text-[#9aa2b1]">
                    to {formatTimestamp(chapter.end_time_ms)}
                  </span>
                )}
              </div>
              {chapter.summary && (
                <p className="mt-1 text-[11px] leading-[17px] text-ff-muted">
                  {chapter.summary}
                </p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-md border border-dashed border-ff-border px-4 py-4 text-[12px] text-ff-muted">
          No chapters available.
        </p>
      )}
    </section>
  );
}
