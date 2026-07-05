import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = true, hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-4xl p-6",
          glass ? "glass" : "glass-strong",
          hover && "transition-all duration-300 hover:-translate-y-1 hover:shadow-glow",
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";
