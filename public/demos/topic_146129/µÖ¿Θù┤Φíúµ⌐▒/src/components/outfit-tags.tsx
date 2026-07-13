type OutfitTagTone = "amber" | "stone";

const toneClasses: Record<OutfitTagTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-[#D97706]",
  stone: "border-stone-200 bg-stone-100 text-stone-700"
};

export function OutfitTag({ children, tone = "amber" }: { children: React.ReactNode; tone?: OutfitTagTone }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold leading-none ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function OutfitTagGroup({ children }: { children: React.ReactNode }) {
  return (
    <div aria-label="组合标签" className="flex flex-wrap items-center gap-1.5">
      {children}
    </div>
  );
}
