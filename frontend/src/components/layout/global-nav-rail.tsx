import Image from "next/image";
import Link from "next/link";

import { Icon, type IconName } from "@/components/ui/icon";

interface RailItem {
  label: string;
  icon: IconName;
  href?: string;
  route?: GlobalNavRoute;
}

export type GlobalNavRoute =
  | "meetings"
  | "uploads"
  | "ask-firefiles"
  | "meeting-status"
  | "integrations"
  | "analytics"
  | "ai-tools"
  | "team"
  | "settings";

const primaryItems: RailItem[] = [
  { label: "Home", icon: "home", href: "/meetings" },
  {
    label: "Ask FireFiles",
    icon: "chat-bubble",
    href: "/ask-firefiles",
    route: "ask-firefiles",
  },
  {
    label: "Meetings",
    icon: "video-library",
    href: "/meetings",
    route: "meetings",
  },
  {
    label: "Meeting Status",
    icon: "equalizer",
    href: "/meeting-status",
    route: "meeting-status",
  },
  { label: "Uploads", icon: "upload", href: "/uploads", route: "uploads" },
];

const insightItems: RailItem[] = [
  {
    label: "Integrations",
    icon: "extension",
    href: "/integrations",
    route: "integrations",
  },
  {
    label: "Analytics",
    icon: "bar-chart",
    href: "/analytics",
    route: "analytics",
  },
  {
    label: "AI Tools",
    icon: "auto-awesome",
    href: "/ai-tools",
    route: "ai-tools",
  },
];

const accountItems: RailItem[] = [
  { label: "Team", icon: "users", href: "/team", route: "team" },
  {
    label: "Settings",
    icon: "settings",
    href: "/settings",
    route: "settings",
  },
  { label: "More", icon: "more-horizontal" },
];

function RailGroup({
  activeRoute,
  expanded,
  items,
}: {
  activeRoute?: GlobalNavRoute;
  expanded: boolean;
  items: RailItem[];
}) {
  return (
    <div className="flex w-full flex-col gap-1.5 px-2">
      {items.map((item) => {
        const isActive = item.route === activeRoute;
        const alignmentClass = expanded
          ? "justify-start gap-3 px-3 text-[13px] max-[860px]:justify-center max-[860px]:px-0"
          : "justify-center";
        const className = `flex h-10 w-full items-center rounded-md ${alignmentClass} ${
          isActive
            ? "border-l-2 border-ff-primary bg-ff-primary-soft font-semibold text-ff-primary"
            : "font-medium text-ff-muted transition-colors hover:bg-ff-muted-surface hover:text-ff-text disabled:cursor-default"
        }`;

        if (item.href) {
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={className}
              href={item.href}
              key={item.label}
              title={item.label}
            >
              <Icon name={item.icon} size={20} />
              {expanded && (
                <span className="max-[860px]:hidden">{item.label}</span>
              )}
            </Link>
          );
        }

        return (
          <button
            aria-label={item.label}
            className={className}
            disabled
            key={item.label}
            title={`${item.label} — coming soon`}
            type="button"
          >
            <Icon name={item.icon} size={20} />
            {expanded && (
              <span className="max-[860px]:hidden">{item.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function GlobalNavRail({
  activeRoute,
  expanded = false,
}: {
  activeRoute?: GlobalNavRoute;
  expanded?: boolean;
}) {
  return (
    <nav
      aria-label="Global navigation"
      className={`global-nav-rail z-40 flex h-full min-h-0 flex-col items-center border-r border-ff-border bg-ff-surface ${
        expanded ? "w-[240px] max-[860px]:w-14" : "w-14"
      }`}
    >
      <Link
        aria-label="FireFiles Meetings"
        className={`flex h-14 w-full shrink-0 items-center border-b border-ff-border ${
          expanded
            ? "justify-start gap-2.5 px-5 max-[860px]:justify-center max-[860px]:px-0"
            : "justify-center"
        }`}
        href="/meetings"
        title="FireFiles"
      >
        <Image
          alt="FireFiles"
          className="size-[27px] object-contain"
          height={27}
          src="https://app.fireflies.ai/logo.png"
          width={27}
        />
        {expanded && (
          <span className="text-[18px] font-bold tracking-[-0.02em] text-[#202536] max-[860px]:hidden">
            FireFiles
          </span>
        )}
      </Link>

      <div className="mt-3 w-full">
        <RailGroup
          activeRoute={activeRoute}
          expanded={expanded}
          items={primaryItems}
        />
      </div>
      <div className="my-2.5 h-px w-full bg-ff-border" />
      <RailGroup
        activeRoute={activeRoute}
        expanded={expanded}
        items={insightItems}
      />
      <div className="my-2.5 h-px w-full bg-ff-border" />
      <div className="mt-auto w-full">
        <RailGroup
          activeRoute={activeRoute}
          expanded={expanded}
          items={accountItems}
        />
      </div>
    </nav>
  );
}
