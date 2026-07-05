import { DIFFICULTY_META, type Difficulty } from "@/types";
import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  level: Difficulty;
  className?: string;
}

export function DifficultyBadge({ level, className }: DifficultyBadgeProps) {
  const meta = DIFFICULTY_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-bold",
        meta.color,
        className,
      )}
    >
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "w-1 h-1 rounded-full",
              i < level ? "bg-current" : "bg-current/30",
            )}
          />
        ))}
      </span>
      {meta.name}
    </span>
  );
}
