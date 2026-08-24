import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "activity"
  | "arrow-right"
  | "auto-awesome"
  | "bar-chart"
  | "bell"
  | "bookmark"
  | "check"
  | "chart"
  | "chat-bubble"
  | "chevron-down"
  | "chevron-right"
  | "close"
  | "copy"
  | "download"
  | "equalizer"
  | "eye"
  | "expand"
  | "extension"
  | "filter"
  | "fire"
  | "hash"
  | "history"
  | "link"
  | "menu"
  | "home"
  | "mic"
  | "more-horizontal"
  | "more-vertical"
  | "person-add"
  | "pause"
  | "play"
  | "plus"
  | "puzzle"
  | "search"
  | "send"
  | "share"
  | "settings"
  | "smile"
  | "smart-toy"
  | "sparkles"
  | "star"
  | "support"
  | "task-check"
  | "thumb-down"
  | "thumb-up"
  | "upload"
  | "user"
  | "users"
  | "video"
  | "video-camera"
  | "video-library"
  | "wand";

const iconPaths: Record<IconName, ReactNode> = {
  activity: (
    <>
      <path d="M4 18V9" />
      <path d="M10 18V5" />
      <path d="M16 18v-7" />
      <path d="M22 18V3" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </>
  ),
  "auto-awesome": (
    <>
      <path d="m12 3 1.15 3.1L16.25 7.25l-3.1 1.15L12 11.5 10.85 8.4 7.75 7.25l3.1-1.15Z" />
      <path d="m18 13 .85 2.15L21 16l-2.15.85L18 19l-.85-2.15L15 16l2.15-.85Z" />
      <path d="m5 13 .65 1.6 1.6.65-1.6.65L5 17.5l-.65-1.6-1.6-.65 1.6-.65Z" />
    </>
  ),
  "bar-chart": (
    <>
      <path d="M5 20v-7" />
      <path d="M12 20V5" />
      <path d="M19 20v-11" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  bookmark: <path d="M6 4h12v17l-6-4-6 4Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  chart: (
    <>
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V3" />
    </>
  ),
  "chat-bubble": <path d="M4 5.5h16v11H8l-4 3Z" />,
  "chevron-down": <path d="m7 9.5 5 5 5-5" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19v2h16v-2" />
    </>
  ),
  expand: (
    <>
      <path d="M15 3h6v6" />
      <path d="m21 3-7 7" />
      <path d="M9 21H3v-6" />
      <path d="m3 21 7-7" />
    </>
  ),
  equalizer: (
    <>
      <path d="M4 13h3l2-6 4 12 2-6h5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  extension: (
    <path d="M20 13h-2.25a2.75 2.75 0 1 0-5.5 0H10V9H6V5h4V3h4v2h4v4h2Z" />
  ),
  filter: (
    <>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  fire: <path d="M13 22c4.4-.8 7-4 7-8.2 0-3-1.5-5.8-4.5-8.4.1 2.5-.8 4-2.2 4.8.2-3.5-1.5-6.4-4.7-8.2.2 3.7-2.1 5.8-3.5 8.3C2.2 15.7 5.8 21.2 11 22c-1.6-1.1-2.4-2.6-2.2-4.3.2-1.8 1.4-3 2.7-4.1.2 1.5.9 2.4 1.8 3.1.8.6 1.2 1.4 1.1 2.3-.1 1.2-.6 2.2-1.4 3Z" />,
  hash: (
    <>
      <path d="M10 3 8 21" />
      <path d="m16 3-2 18" />
      <path d="M4 9h16" />
      <path d="M3 15h16" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v5" />
    </>
  ),
  "more-horizontal": (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  "more-vertical": (
    <>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  "person-add": (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </>
  ),
  pause: (
    <>
      <path d="M9 6v12" />
      <path d="M15 6v12" />
    </>
  ),
  play: <path d="m9 6 9 6-9 6Z" fill="currentColor" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  puzzle: <path d="M19 13h-2.2a2.8 2.8 0 1 0-5.6 0H9V9H5V5h4V3h6v2h4v4h2v4Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.5" />
      <path d="m8.2 13.2 7.6 4.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.4 2 4 2 4-2 4-2" />
      <circle cx="9" cy="9" r=".8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r=".8" fill="currentColor" stroke="none" />
    </>
  ),
  "smart-toy": (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4" />
      <circle cx="12" cy="3" r="1" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M9 16h6" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2Z" />
      <path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z" />
      <path d="m5 13 .7 1.8 1.8.7-1.8.7L5 18l-.7-1.8-1.8-.7 1.8-.7Z" />
    </>
  ),
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
  support: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
      <path d="M3 10v5h3" />
      <path d="M21 10v5h-3" />
    </>
  ),
  "task-check": (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m8 12 2.5 2.5L16.5 8" />
    </>
  ),
  "thumb-down": (
    <>
      <path d="M7 4v11" />
      <path d="M7 5h8.2a2 2 0 0 1 1.9 1.4l1.6 5A2 2 0 0 1 16.8 14H13l.5 3.1a2.5 2.5 0 0 1-2.5 2.9L7 14.5" />
      <path d="M3 4h4v11H3Z" />
    </>
  ),
  "thumb-up": (
    <>
      <path d="M7 20V9" />
      <path d="M7 19h8.2a2 2 0 0 0 1.9-1.4l1.6-5A2 2 0 0 0 16.8 10H13l.5-3.1A2.5 2.5 0 0 0 11 4L7 9.5" />
      <path d="M3 9h4v11H3Z" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M4 15v5h16v-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M16 5a4 4 0 0 1 0 7" />
      <path d="M17 15a6 6 0 0 1 5 6" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3Z" />
    </>
  ),
  "video-camera": (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3Z" />
    </>
  ),
  "video-library": (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M7 3h10" />
      <path d="m10 10 5 3-5 3Z" />
    </>
  ),
  wand: (
    <>
      <path d="m4 20 10-10" />
      <path d="m13 3 .8 2.2L16 6l-2.2.8L13 9l-.8-2.2L10 6l2.2-.8Z" />
      <path d="m19 10 .7 1.8 1.8.7-1.8.7L19 15l-.7-1.8-1.8-.7 1.8-.7Z" />
      <path d="m5 4 .6 1.4L7 6l-1.4.6L5 8l-.6-1.4L3 6l1.4-.6Z" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}
