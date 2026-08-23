import Image from "next/image";
import Link from "next/link";

import { Icon, type IconName } from "@/components/ui/icon";

interface RailItem {
  label: string;
  icon: IconName;
  active?: boolean;
}

const primaryItems: RailItem[] = [
  { label: "Home", icon: "home" },
  { label: "Ask AI", icon: "chat-bubble" },
  { label: "Meetings", icon: "video-library", active: true },
  { label: "Meeting Status", icon: "equalizer" },
  { label: "Uploads", icon: "upload" },
];

const insightItems: RailItem[] = [
  { label: "Integrations", icon: "extension" },
  { label: "Analytics", icon: "bar-chart" },
  { label: "AI Tools", icon: "auto-awesome" },
];

const accountItems: RailItem[] = [
  { label: "Team", icon: "users" },
  { label: "Settings", icon: "settings" },
  { label: "More", icon: "more-horizontal" },
];

function RailGroup({ items }: { items: RailItem[] }) {
  return (
    <div className="flex w-full flex-col gap-1.5 px-2">
      {items.map((item) => {
        const className = item.active
          ? "flex h-10 w-full items-center justify-center rounded-md bg-ff-primary-soft text-ff-primary"
          : "flex h-10 w-full items-center justify-center rounded-md text-ff-muted transition-colors hover:bg-ff-muted-surface hover:text-ff-text disabled:cursor-default";

        if (item.active) {
          return (
            <Link
              aria-current="page"
              aria-label={item.label}
              className={className}
              href="/meetings"
              key={item.label}
              title={item.label}
            >
              <Icon name={item.icon} size={20} />
            </Link>
          );
        }

        return (
          <button
            aria-label={item.label}
            className={className}
            disabled
            key={item.label}
            title={`${item.label} — available in an upcoming step`}
            type="button"
          >
            <Icon name={item.icon} size={20} />
          </button>
        );
      })}
    </div>
  );
}

export function GlobalNavRail() {
  return (
    <nav
      aria-label="Global navigation"
      className="global-nav-rail z-40 flex h-full min-h-0 w-14 flex-col items-center border-r border-ff-border bg-ff-surface"
    >
      <Link
        aria-label="FireFiles Meetings"
        className="flex h-14 w-full shrink-0 items-center justify-center border-b border-ff-border"
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
      </Link>

      <div className="mt-3 w-full">
        <RailGroup items={primaryItems} />
      </div>
      <div className="my-2.5 h-px w-full bg-ff-border" />
      <RailGroup items={insightItems} />
      <div className="my-2.5 h-px w-full bg-ff-border" />
      <div className="mt-auto w-full">
        <RailGroup items={accountItems} />
      </div>
    </nav>
  );
}
