import { cn } from "@/lib/utils";

interface MasteryBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function MasteryBar({
  value,
  showLabel = true,
  size = "md",
  className,
}: MasteryBarProps) {
  const v = Math.max(0, Math.min(100, value));
  const tone =
    v >= 80 ? "from-mint-400 to-mint-500"
    : v >= 50 ? "from-brand-400 to-brand-500"
    : v >= 30 ? "from-amber-300 to-amber-500"
    : "from-rose-400 to-rose-500";
  const label =
    v >= 80 ? "已掌握" : v >= 50 ? "较熟" : v >= 30 ? "待巩固" : "薄弱";
  const labelColor =
    v >= 80 ? "text-mint-600"
    : v >= 50 ? "text-brand-600"
    : v >= 30 ? "text-amber-600"
    : "text-rose-600";

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn("text-xs font-medium", labelColor)}>{label}</span>
          <span className="num-display text-xs text-ink-500">{v}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-ink-100/70 overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
      >
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", tone)}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
