import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "mint" | "amber" | "rose" | "purple" | "ink" | "teal";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: "xs" | "sm";
}

const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  mint: "bg-mint-50 text-mint-700 border-mint-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
  ink: "bg-ink-100 text-ink-700 border-ink-200",
  teal: "bg-teal-50 text-teal-700 border-teal-100",
};

export function Tag({ className, tone = "ink", size = "sm", ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "xs" ? "h-5 px-2 text-[11px]" : "h-7 px-2.5 text-xs",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
