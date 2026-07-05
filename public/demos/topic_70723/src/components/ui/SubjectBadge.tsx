import { getSubject } from "@/data/subjects";
import type { Subject } from "@/types";
import { cn } from "@/lib/utils";

interface SubjectBadgeProps {
  subject: Subject;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

export function SubjectBadge({
  subject,
  size = "md",
  showName = true,
  className,
}: SubjectBadgeProps) {
  const meta = getSubject(subject);
  const sizes = {
    sm: { box: "w-7 h-7 text-xs", text: "text-xs" },
    md: { box: "w-9 h-9 text-sm", text: "text-sm" },
    lg: { box: "w-12 h-12 text-base", text: "text-base" },
  };
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-xl font-bold text-white shadow-sm",
          sizes[size].box,
        )}
        style={{ background: meta.color }}
      >
        {meta.shortName}
      </span>
      {showName && (
        <span className={cn("font-medium text-ink-700", sizes[size].text)}>
          {meta.name}
        </span>
      )}
    </span>
  );
}
