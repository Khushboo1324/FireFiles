import { Icon } from "@/components/ui/icon";
import { formatTimestamp } from "@/lib/formatters/meeting";

interface MeetingPlayerProps {
  durationSeconds: number;
  mediaUrl: string | null;
}

function PlayerButton({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      className={`flex items-center justify-center disabled:opacity-100 ${className}`}
      disabled
      title={`${label} — playback will be added in a later step`}
      type="button"
    >
      {children}
    </button>
  );
}

export function MeetingPlayer({
  durationSeconds,
  mediaUrl,
}: MeetingPlayerProps) {
  return (
    <footer
      className="meeting-player z-40 flex min-w-0 flex-col border-t border-ff-border bg-white"
      data-media-available={mediaUrl ? "true" : "false"}
    >
      <div aria-label="Playback position" className="h-1 shrink-0 bg-[#eceef2]">
        <div className="h-full w-0 bg-ff-primary" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 items-center px-5">
        <div className="flex min-w-0 items-center gap-3 text-[11px]">
          <span className="shrink-0 text-[#8a93a4]">
            <strong className="font-semibold text-[#384257]">00:00</strong>
            {" / "}
            {formatTimestamp(durationSeconds * 1000)}
          </span>
          <span className="h-4 w-px bg-ff-border max-[900px]:hidden" />
          <button
            className="truncate font-medium text-ff-primary disabled:opacity-100 max-[900px]:hidden"
            disabled
            title="Playback will be added in a later step"
            type="button"
          >
            Start from beginning
          </button>
        </div>

        <div className="flex items-center justify-center gap-5 text-[#536077]">
          <button
            className="text-[11px] font-semibold disabled:opacity-100"
            disabled
            title="Playback speed — available in a later step"
            type="button"
          >
            1×
          </button>
          <PlayerButton label="Rewind 10 seconds">
            <Icon name="history" size={20} />
          </PlayerButton>
          <PlayerButton
            className="size-10 rounded-full bg-ff-primary text-white"
            label="Play"
          >
            <Icon className="ml-0.5" name="play" size={22} />
          </PlayerButton>
          <PlayerButton label="Forward 10 seconds">
            <Icon className="-scale-x-100" name="history" size={20} />
          </PlayerButton>
        </div>

        <div className="flex items-center justify-end gap-3 text-[#657087]">
          <PlayerButton className="max-[900px]:hidden" label="Favorite meeting">
            <Icon name="star" size={18} />
          </PlayerButton>
          <PlayerButton label="Download recording">
            <Icon name="download" size={19} />
          </PlayerButton>
          <PlayerButton className="max-[900px]:hidden" label="More player options">
            <Icon name="more-horizontal" size={18} />
          </PlayerButton>
        </div>
      </div>
    </footer>
  );
}
