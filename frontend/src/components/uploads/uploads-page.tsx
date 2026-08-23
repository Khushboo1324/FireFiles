"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { GlobalNavRail } from "@/components/layout/global-nav-rail";
import {
  ImportTranscriptModal,
  type ImportSource,
} from "@/components/uploads/import-transcript-modal";
import { UploadDropzone } from "@/components/uploads/upload-dropzone";
import { Icon } from "@/components/ui/icon";

export function UploadsPage() {
  const router = useRouter();
  const [source, setSource] = useState<ImportSource | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }
    const timeoutId = window.setTimeout(() => setShowSuccess(false), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [showSuccess]);

  function finishImport(meetingId: number) {
    setSource(null);
    setShowSuccess(true);
    window.setTimeout(() => router.push(`/meetings/${meetingId}`), 550);
  }

  function openMeeting(meetingId: number) {
    setSource(null);
    router.push(`/meetings/${meetingId}`);
  }

  return (
    <main className="uploads-shell bg-white">
      <GlobalNavRail activeRoute="uploads" expanded />
      <AppHeader
        search={{
          value: "",
          onChange: () => undefined,
          placeholder: "Search by title or keyword",
          ariaLabel: "Upload search coming soon",
          disabled: true,
          title: "Upload search coming soon",
        }}
        title="Uploads"
      />

      <section className="uploads-workspace min-h-0 overflow-y-auto bg-white px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center">
          <aside className="mb-9 flex w-full max-w-[1090px] items-center justify-center rounded-lg bg-[#fff9e9] px-5 py-3 text-center text-[12px] text-[#4b5263]">
            <Icon className="mr-2 shrink-0 text-[#a57b28]" name="auto-awesome" size={15} />
            <p>
              <strong className="font-semibold text-[#242938]">Import a transcript</strong>
              {" — "}upload a supported file or paste timestamped text into a meeting.
            </p>
          </aside>

          <UploadDropzone
            onFileSelected={(file) => setSource({ kind: "file", file })}
            onPasteRequested={() => setSource({ kind: "paste" })}
          />

          <section className="mt-14 flex flex-col items-center justify-center text-center">
            <span className="flex size-12 items-center justify-center rounded-lg border border-[#d8dbe1] bg-[#fafafa] text-[#a8aeb9]">
              <Icon name="download" size={25} />
            </span>
            <h2 className="mt-4 text-[17px] font-semibold text-[#202536]">
              You have no recent uploads!
            </h2>
            <p className="mt-1 text-[11px] text-ff-muted">
              Uploaded transcripts will appear here.
            </p>
          </section>
        </div>
      </section>

      {source && (
        <ImportTranscriptModal
          onClose={() => setSource(null)}
          onOpenMeeting={openMeeting}
          onSuccess={finishImport}
          source={source}
        />
      )}

      {showSuccess && (
        <div
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#242038] px-4 py-3 text-[12px] font-semibold text-white shadow-lg"
          role="status"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-[#55b987]">
            <Icon name="check" size={13} />
          </span>
          Transcript uploaded.
        </div>
      )}
    </main>
  );
}
