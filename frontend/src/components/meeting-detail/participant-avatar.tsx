import type { ParticipantCompact } from "@/lib/api/types";
import { getInitials } from "@/lib/formatters/meeting";

const avatarColors = [
  "bg-[#e7f0ff] text-[#2d5fa4]",
  "bg-[#e5f5ec] text-[#287052]",
  "bg-[#f4eaff] text-[#6d35a1]",
  "bg-[#fff1dc] text-[#9b601f]",
];

interface ParticipantAvatarProps {
  participant: ParticipantCompact;
  size?: "small" | "medium";
}

export function ParticipantAvatar({
  participant,
  size = "medium",
}: ParticipantAvatarProps) {
  const sizeClass =
    size === "small" ? "size-5 text-[8px]" : "size-8 text-[10px]";
  const colorClass = avatarColors[participant.id % avatarColors.length];
  const backgroundStyle = participant.avatar_url
    ? { backgroundImage: `url(${JSON.stringify(participant.avatar_url)})` }
    : undefined;

  return (
    <span
      aria-label={participant.name}
      className={`flex shrink-0 items-center justify-center rounded-md bg-cover bg-center font-bold ${sizeClass} ${colorClass}`}
      role="img"
      style={backgroundStyle}
      title={participant.name}
    >
      {!participant.avatar_url && getInitials(participant.name)}
    </span>
  );
}
