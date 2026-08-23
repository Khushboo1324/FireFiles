import { GlobalNavRail } from "@/components/layout/global-nav-rail";
import { AskFireFilesPanel } from "@/components/meetings/ask-firefiles-panel";
import { MeetingsSidebar } from "@/components/meetings/meetings-sidebar";
import { MeetingsWorkspace } from "@/components/meetings/meetings-workspace";

export function MeetingsPage() {
  return (
    <main className="meetings-shell bg-white">
      <GlobalNavRail />
      <MeetingsSidebar />
      <MeetingsWorkspace />
      <AskFireFilesPanel />
    </main>
  );
}
