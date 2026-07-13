import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  size?: "sm" | "md";
};

export function BrandMark({ href, size = "md" }: BrandMarkProps) {
  const content = (
    <span className="grid gap-2">
      <span className="flex items-center gap-2">
        <span
          className={`brand-title font-semibold leading-none text-[#D97706] ${size === "sm" ? "text-xl" : "text-2xl"}`}
        >
          晨间衣橱
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold leading-none tracking-[0.12em] text-[#D97706]">
          BETA
        </span>
      </span>
      <span className={`brand-display leading-none text-stone-500 ${size === "sm" ? "text-xs" : "text-sm"}`}>
        Morning Atelier
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link aria-label="晨间衣橱 首页" className="inline-flex w-fit" href={href}>
      {content}
    </Link>
  );
}
