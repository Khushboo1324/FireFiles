"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { GlobalNavRail } from "@/components/layout/global-nav-rail";
import {
  ImportTranscriptModal,
  type ImportSource,
} from "@/components/uploads/import-transcript-modal";
import { UploadDropzone } from "@/components/uploads/upload-dropzone";
import { Icon } from "@/components/ui/icon";
import { Toast, type ToastNotification } from "@/components/ui/toast";

export function UploadsPage() {
  const router = useRouter();
  const [source, setSource] = useState<ImportSource | null>(null);
  const [notification, setNotification] = useState<ToastNotification | null>(
    null,
  );

  function finishImport(meetingId: number) {
    setSource(null);
    setNotification({
      id: Date.now(),
      message: "Transcript uploaded.",
      tone: "success",
    });
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
          disabled: true,
          title: "Meeting search is available from the Meetings page.",
        }}
        title="Uploads"
      />

      <section className="uploads-workspace min-h-0 overflow-y-auto bg-white px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center">
          <aside className="mb-9 flex w-full max-w-[910px] items-center justify-center rounded-lg bg-[#fff9e9] px-5 py-3 text-center text-[12px] text-[#4b5263]">
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

          <section className="mt-12 flex flex-col items-center justify-center text-center">
            <span className="flex size-12 items-center justify-center rounded-lg border border-[#d8dbe1] bg-[#fafafa] text-[#a8aeb9]">
              <Icon name="download" size={25} />
            </span>
            <h2 className="mt-4 text-[17px] font-semibold text-[#202536]">
              You have no recent uploads!
            </h2>
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

      <Toast
        notification={notification}
        onDismiss={() => setNotification(null)}
      />
    </main>
  );
}
