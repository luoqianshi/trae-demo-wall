import { cn } from "@/lib/utils";
import { SUBJECT_COLORS, type Subject } from "@/types/question";

interface Props {
  subject: Subject;
  variant?: "solid" | "soft";
  className?: string;
}

export default function SubjectTag({ subject, variant = "soft", className }: Props) {
  const colors = SUBJECT_COLORS[subject];
  return (
    <span
      className={cn(
        "tag",
        variant === "solid" ? `${colors.bg} ${colors.text}` : colors.soft,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {subject}
    </span>
  );
}
