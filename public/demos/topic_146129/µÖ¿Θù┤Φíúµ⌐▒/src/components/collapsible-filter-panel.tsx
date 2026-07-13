import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function CollapsibleFilterPanel({
  ariaLabel,
  children,
  meta,
  showSummaryOnDesktop = false,
  title = "筛选项"
}: {
  ariaLabel: string;
  children: ReactNode;
  meta?: ReactNode;
  showSummaryOnDesktop?: boolean;
  title?: string;
}) {
  const summaryClassName = [
    "flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-stone-800 [&::-webkit-details-marker]:hidden",
    showSummaryOnDesktop ? "border-b border-stone-100 pb-3" : "lg:hidden"
  ].join(" ");
  const contentClassName = ["responsive-filter-content grid gap-4", showSummaryOnDesktop ? "pt-4" : "pt-3 lg:pt-0"].join(" ");

  return (
    <section aria-label={ariaLabel} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <details className="responsive-filter group">
        <summary className={summaryClassName}>
          <span className="flex items-center gap-3">
            <span>{title}</span>
            {meta === undefined ? null : (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#D97706]">
                {meta}
              </span>
            )}
          </span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-stone-500 transition group-open:rotate-180" />
        </summary>
        <div className={contentClassName}>{children}</div>
      </details>
    </section>
  );
}
