"use client";

import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { listMeetings } from "@/lib/api/meetings";
import type { MeetingListResponse } from "@/lib/api/types";

export default function Home() {
  const [meetings, setMeetings] = useState<MeetingListResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignoreResult = false;

    listMeetings()
      .then((response) => {
        if (!ignoreResult) {
          setMeetings(response);
        }
      })
      .catch((error: unknown) => {
        if (!ignoreResult) {
          setErrorMessage(
            error instanceof ApiError
              ? error.message
              : "Unable to load meetings from the FireFiles API.",
          );
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, []);

  // Temporary proof of connectivity; the Meetings workspace will replace this page.
  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">FireFiles API connectivity</h1>

      {!meetings && !errorMessage && (
        <p className="mt-4 text-zinc-600">Connecting to FastAPI…</p>
      )}

      {errorMessage && (
        <p className="mt-4 text-red-700" role="alert">
          Connection error: {errorMessage}
        </p>
      )}

      {meetings && (
        <section className="mt-4">
          <h2 className="font-medium text-green-700">
            Backend connected — {meetings.total}{" "}
            {meetings.total === 1 ? "meeting" : "meetings"}
          </h2>
          {meetings.items.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {meetings.items.map((meeting) => (
                <li key={meeting.id}>{meeting.title}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-zinc-600">No meetings returned.</p>
          )}
        </section>
      )}
    </main>
  );
}
