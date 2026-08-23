import type { MeetingPlaybackController } from "@/components/meeting-detail/use-meeting-playback";
import { Icon } from "@/components/ui/icon";
import { formatTimestamp } from "@/lib/formatters/meeting";
import type { RefObject } from "react";

interface MeetingPlayerProps {
  durationSeconds?: number;
  mediaElementRef?: RefObject<HTMLAudioElement | null>;
  mediaUrl?: string | null;
  playback?: MeetingPlaybackController;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function PlayerButton({
  label,
  children,
  className = "",
  disabled = false,
  onClick,
  title,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      aria-label={label}
      className={`flex items-center justify-center rounded transition-colors hover:bg-ff-muted-surface disabled:cursor-default disabled:opacity-40 ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

export function MeetingPlayer({
  durationSeconds: placeholderDuration = 0,
  mediaElementRef,
  mediaUrl: placeholderMediaUrl = null,
  playback,
}: MeetingPlayerProps) {
  const currentTimeSeconds = playback?.currentTimeSeconds ?? 0;
  const durationSeconds = playback?.durationSeconds ?? placeholderDuration;
  const mediaUrl = playback?.mediaUrl ?? placeholderMediaUrl;
  const progress =
    durationSeconds > 0
      ? Math.min(100, (currentTimeSeconds / durationSeconds) * 100)
      : 0;
  const isDisabled = playback === undefined || durationSeconds <= 0;

  return (
    <footer
      className="meeting-player relative z-40 flex min-w-0 flex-col border-t border-ff-border bg-white"
      data-media-available={mediaUrl ? "true" : "false"}
      data-player-mode={playback?.isRealMedia ? "media" : "timeline"}
    >
      {playback?.hasMediaError && (
        <span
          className="absolute bottom-full right-3 mb-2 rounded-md border border-[#e1d8f0] bg-white px-3 py-2 text-[10px] text-[#6f5c82] shadow-sm"
          role="status"
        >
          Media couldn&apos;t be loaded. Timeline controls are still available.
        </span>
      )}
      {playback?.isRealMedia && mediaUrl && mediaElementRef && (
        <audio preload="metadata" ref={mediaElementRef} src={mediaUrl} />
      )}

      <input
        aria-label="Playback position"
        className="meeting-player-seek shrink-0"
        disabled={isDisabled}
        max={durationSeconds}
        min={0}
        onChange={(event) => playback?.seek(Number(event.currentTarget.value))}
        step="any"
        style={{ "--player-progress": `${progress}%` } as React.CSSProperties}
        type="range"
        value={currentTimeSeconds}
      />

      <div className="grid min-h-0 flex-1 grid-cols-3 items-center px-5">
        <div className="flex min-w-0 items-center gap-3 text-[11px]">
          <span className="shrink-0 text-[#8a93a4] tabular-nums">
            <strong className="font-semibold text-[#384257]">
              {formatTimestamp(currentTimeSeconds * 1000)}
            </strong>
            {" / "}
            {formatTimestamp(durationSeconds * 1000)}
          </span>
          <span className="h-4 w-px bg-ff-border max-[900px]:hidden" />
          <button
            className="truncate rounded font-medium text-ff-primary hover:underline disabled:cursor-default disabled:opacity-40 max-[900px]:hidden"
            disabled={isDisabled}
            onClick={() => playback?.seek(0)}
            type="button"
          >
            Start from beginning
          </button>
        </div>

        <div className="flex items-center justify-center gap-5 text-[#536077]">
          <select
            aria-label="Playback speed"
            className="cursor-pointer rounded bg-white px-1 py-1 text-[11px] font-semibold text-[#536077] hover:bg-ff-muted-surface disabled:cursor-default disabled:opacity-40"
            disabled={playback === undefined}
            onChange={(event) =>
              playback?.setPlaybackRate(Number(event.currentTarget.value))
            }
            value={playback?.playbackRate ?? 1}
          >
            {PLAYBACK_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
          <PlayerButton
            disabled={isDisabled}
            label="Rewind 10 seconds"
            onClick={() => playback?.skip(-10)}
          >
            <Icon name="history" size={20} />
          </PlayerButton>
          <PlayerButton
            className="size-10 rounded-full bg-ff-primary text-white hover:bg-ff-primary-hover disabled:bg-ff-primary"
            disabled={isDisabled}
            label={playback?.isPlaying ? "Pause" : "Play"}
            onClick={playback?.togglePlayback}
          >
            <Icon
              className={playback?.isPlaying ? "" : "ml-0.5"}
              name={playback?.isPlaying ? "pause" : "play"}
              size={22}
            />
          </PlayerButton>
          <PlayerButton
            disabled={isDisabled}
            label="Forward 10 seconds"
            onClick={() => playback?.skip(10)}
          >
            <Icon className="-scale-x-100" name="history" size={20} />
          </PlayerButton>
        </div>

        <div className="flex items-center justify-end gap-3 text-[#657087]">
          <PlayerButton
            className="max-[900px]:hidden"
            disabled
            label="Favorite meeting"
            title="Favorite is not available yet"
          >
            <Icon name="star" size={18} />
          </PlayerButton>
          {mediaUrl ? (
            <a
              aria-label="Download recording"
              className="flex size-7 items-center justify-center rounded transition-colors hover:bg-ff-muted-surface"
              download
              href={mediaUrl}
              title="Download recording"
            >
              <Icon name="download" size={19} />
            </a>
          ) : (
            <PlayerButton
              disabled
              label="Download recording"
              title="No media file available"
            >
              <Icon name="download" size={19} />
            </PlayerButton>
          )}
          <PlayerButton
            className="max-[900px]:hidden"
            disabled
            label="More player options"
            title="More player options are not available yet"
          >
            <Icon name="more-horizontal" size={18} />
          </PlayerButton>
        </div>
      </div>
    </footer>
  );
}
