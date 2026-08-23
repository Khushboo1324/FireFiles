import { AppHeader } from "@/components/layout/app-header";
import {
  GlobalNavRail,
  type GlobalNavRoute,
} from "@/components/layout/global-nav-rail";
import { Icon, type IconName } from "@/components/ui/icon";

interface PlaceholderSection {
  description: string;
  title: string;
}

interface FeaturePlaceholderProps {
  activeRoute: GlobalNavRoute;
  description: string;
  icon: IconName;
  sections?: PlaceholderSection[];
  title: string;
}

export function FeaturePlaceholder({
  activeRoute,
  description,
  icon,
  sections = [],
  title,
}: FeaturePlaceholderProps) {
  return (
    <main className="placeholder-shell bg-white">
      <GlobalNavRail activeRoute={activeRoute} expanded />
      <AppHeader title={title} />

      <section className="placeholder-workspace min-h-0 overflow-y-auto bg-ff-background px-8 py-10">
        <div className="mx-auto w-full max-w-[760px] rounded-xl border border-ff-border bg-white px-7 py-8 shadow-[0_1px_3px_rgba(25,28,29,0.04)]">
          <span className="flex size-10 items-center justify-center rounded-lg border border-[#ded5ef] bg-ff-primary-soft text-ff-primary">
            <Icon name={icon} size={20} />
          </span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ff-primary">
            Coming soon
          </p>
          <h1 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-[#202536]">
            {title}
          </h1>
          <p className="mt-2 max-w-[600px] text-[12px] leading-5 text-ff-muted">
            {description}
          </p>

          {sections.length > 0 && (
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {sections.map((section) => (
                <section
                  className="rounded-lg border border-ff-border bg-ff-subtle px-4 py-4"
                  key={section.title}
                >
                  <h2 className="text-[12px] font-semibold text-ff-text">
                    {section.title}
                  </h2>
                  <p className="mt-1.5 text-[11px] leading-[18px] text-ff-muted">
                    {section.description}
                  </p>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
