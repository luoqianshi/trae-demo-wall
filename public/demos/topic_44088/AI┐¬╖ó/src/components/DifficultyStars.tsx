import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS } from "@/types/question";

interface Props {
  level: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function DifficultyStars({ level, showLabel = true, size = "sm" }: Props) {
  const starSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              i <= level ? "fill-coral text-coral" : "fill-paper-200 text-paper-300"
            )}
            strokeWidth={1.5}
          />
        ))}
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-ink-400">{DIFFICULTY_LABELS[level]}</span>
      )}
    </span>
  );
}
