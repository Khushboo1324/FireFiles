import type { MeetingSummary as MeetingSummaryData } from "@/lib/api/types";

export function MeetingSummary({
  summary,
}: {
  summary: MeetingSummaryData | null;
}) {
  if (!summary) {
    return (
      <section aria-labelledby="notes-heading">
        <h2 className="text-[15px] font-semibold text-[#313b51]" id="notes-heading">
          Notes
        </h2>
        <div className="mt-4 rounded-md border border-dashed border-ff-border px-4 py-5 text-[12px] text-ff-muted">
          No summary available for this meeting.
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="notes-heading">
      <h2 className="text-[15px] font-semibold text-[#313b51]" id="notes-heading">
        Notes
      </h2>
      <div className="mt-4 space-y-5 text-[13px] leading-6 text-[#45516a]">
        <div>
          <h3 className="mb-1.5 text-[13px] font-semibold text-[#252c3d]">
            Overview
          </h3>
          <p className="whitespace-pre-wrap">{summary.overview}</p>
        </div>
        {summary.short_summary && (
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-[#252c3d]">
              Quick recap
            </h3>
            <p className="whitespace-pre-wrap">{summary.short_summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
