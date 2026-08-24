import { GlobalNavRail } from "@/components/layout/global-nav-rail";
import { AskFireFilesPanel } from "@/components/meetings/ask-firefiles-panel";
import { MeetingsSidebar } from "@/components/meetings/meetings-sidebar";
import { MeetingsWorkspace } from "@/components/meetings/meetings-workspace";

interface MeetingsPageProps {
  openCreateDialog?: boolean;
}

export function MeetingsPage({ openCreateDialog = false }: MeetingsPageProps) {
  return (
    <main className="meetings-shell bg-white">
      <GlobalNavRail activeRoute="meetings" />
      <MeetingsSidebar />
      <MeetingsWorkspace openCreateDialog={openCreateDialog} />
      <AskFireFilesPanel />
    </main>
  );
}
