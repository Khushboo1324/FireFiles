"use client";

import { useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";

export const MAX_TRANSCRIPT_FILE_BYTES = 5 * 1024 * 1024;

const acceptedMimeTypes: Record<string, Set<string>> = {
  txt: new Set(["text/plain", "application/octet-stream"]),
  json: new Set(["application/json", "text/json", "application/octet-stream"]),
  vtt: new Set(["text/vtt", "text/plain", "application/octet-stream"]),
};

function validateTranscriptFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const acceptedTypes = acceptedMimeTypes[extension];

  if (!acceptedTypes || (file.type && !acceptedTypes.has(file.type))) {
    return "Unsupported file type. Choose a TXT, JSON, or VTT transcript.";
  }
  if (file.size > MAX_TRANSCRIPT_FILE_BYTES) {
    return "This file exceeds the backend's 5 MiB upload limit.";
  }
  return null;
}

export function UploadDropzone({
  onFileSelected,
  onPasteRequested,
}: {
  onFileSelected: (file: File) => void;
  onPasteRequested: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const validationError = validateTranscriptFile(file);
    setError(validationError);
    if (!validationError) {
      onFileSelected(file);
    }
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <section aria-labelledby="upload-heading" className="w-full max-w-[1200px]">
      <input
        accept=".txt,.json,.vtt,text/plain,application/json,text/json,text/vtt"
        aria-label="Choose a TXT, JSON, or VTT transcript"
        className="sr-only"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <div
        aria-describedby="upload-support upload-error"
        aria-label="Choose or drop a transcript file"
        className={`flex min-h-[310px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors ${
          isDragging
            ? "border-ff-primary bg-ff-primary-soft"
            : "border-[#a988ed] bg-white hover:border-ff-primary hover:bg-[#fcfaff]"
        }`}
        onClick={openFilePicker}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span className="mb-5 flex size-11 items-center justify-center rounded-full bg-ff-primary-soft text-ff-primary">
          <Icon name="upload" size={22} />
        </span>
        <h2
          className="text-[18px] font-semibold leading-7 text-[#202536]"
          id="upload-heading"
        >
          Upload a file to generate a transcript
        </h2>
        <p className="mt-2 text-[12px] leading-5 text-ff-muted" id="upload-support">
          Browse or drag and drop <strong>TXT, JSON, or VTT</strong> files. (Max
          file size: 5 MiB)
        </p>
        <span className="mt-7 inline-flex h-10 items-center rounded-[5px] bg-ff-primary px-6 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-ff-primary-hover">
          Browse Files
        </span>
        <p
          aria-live="polite"
          className="mt-3 min-h-4 text-[11px] font-medium text-ff-error"
          id="upload-error"
        >
          {error}
        </p>
      </div>
      <div className="mt-3 text-center text-[11px] text-ff-muted">
        or{" "}
        <button
          className="font-semibold text-ff-primary underline-offset-4 hover:underline"
          onClick={onPasteRequested}
          type="button"
        >
          paste a transcript
        </button>
      </div>
    </section>
  );
}
