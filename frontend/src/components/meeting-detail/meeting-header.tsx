import Link from "next/link";

import { MeetingActionsMenu } from "@/components/meetings/meeting-actions-menu";
import { Icon } from "@/components/ui/icon";

interface MeetingHeaderProps {
  title: string;
  isLoading?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function MeetingHeader({
  title,
  isLoading = false,
  onDelete,
  onEdit,
}: MeetingHeaderProps) {
  return (
    <header className="meeting-detail-header z-30 flex h-[58px] min-w-0 items-center justify-between border-b border-ff-border bg-white px-4">
      <div className="flex min-w-0 items-center gap-2.5 text-[13px]">
        <Link
          aria-label="Back to Meetings"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-ff-muted transition-colors hover:bg-ff-muted-surface hover:text-ff-text"
          href="/meetings"
        >
          <Icon name="menu" size={19} />
        </Link>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
          <Link
            className="shrink-0 font-medium text-[#4f5f78] hover:text-ff-primary"
            href="/meetings"
          >
            # My Meetings
          </Link>
          <span aria-hidden="true" className="text-[#a4aabc]">
            /
          </span>
          {isLoading ? (
            <span className="h-4 w-36 animate-pulse rounded bg-ff-border-soft" />
          ) : (
            <span className="max-w-[42vw] truncate font-medium text-ff-text">
              {title}
            </span>
          )}
        </nav>
        {onDelete && onEdit && (
          <MeetingActionsMenu
            icon="more-horizontal"
            meetingTitle={title}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="mr-1 flex items-center gap-1.5 text-[11px] text-[#8b95a8] max-[900px]:hidden">
          <Icon name="eye" size={17} />
          1 View
        </span>
        <button
          className="flex h-8 items-center gap-1.5 rounded-[5px] bg-ff-primary px-3.5 text-[12px] font-semibold text-white disabled:opacity-100"
          disabled
          title="Sharing — available in an upcoming step"
          type="button"
        >
          <Icon name="share" size={15} />
          <span className="max-[700px]:hidden">Share</span>
        </button>
        <button
          aria-label="Copy meeting link"
          className="flex size-8 items-center justify-center rounded-[5px] bg-ff-primary text-white disabled:opacity-100"
          disabled
          title="Copy link — available in an upcoming step"
          type="button"
        >
          <Icon name="link" size={16} />
        </button>
        <span className="mx-1 h-5 w-px bg-ff-border" />
        <button
          aria-label="Add"
          className="flex size-8 items-center justify-center rounded-md border border-ff-border text-ff-muted disabled:opacity-100 max-[700px]:hidden"
          disabled
          title="Add — available in an upcoming step"
          type="button"
        >
          <Icon name="plus" size={17} />
        </button>
        <button
          aria-label="Notifications"
          className="relative flex size-8 items-center justify-center rounded-md text-ff-muted disabled:opacity-100 max-[700px]:hidden"
          disabled
          title="Notifications — available in an upcoming step"
          type="button"
        >
          <Icon name="bell" size={18} />
          <span className="absolute right-1.5 top-1 size-2 rounded-full border-2 border-white bg-ff-error" />
        </button>
        <span
          aria-label="Demo user"
          className="ml-1 flex size-8 items-center justify-center rounded-md bg-ff-avatar text-[12px] font-semibold text-white"
          role="img"
        >
          C
        </span>
      </div>
    </header>
  );
}
