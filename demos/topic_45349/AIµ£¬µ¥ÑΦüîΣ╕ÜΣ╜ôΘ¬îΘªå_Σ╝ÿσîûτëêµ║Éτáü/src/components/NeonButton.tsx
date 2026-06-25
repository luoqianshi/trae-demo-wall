import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles = {
  primary:
    "border-white/20 bg-white/[0.04] text-ink-200 hover:bg-white/[0.08] hover:border-white/30 hover:text-ink-100",
  secondary:
    "border-white/15 bg-white/[0.03] text-ink-300 hover:bg-white/[0.06] hover:border-white/25 hover:text-ink-100",
  ghost:
    "border-white/10 bg-transparent text-ink-300 hover:border-white/20 hover:text-ink-100 hover:bg-white/[0.03]",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export default function NeonButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: NeonButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-all duration-300",
        "backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
