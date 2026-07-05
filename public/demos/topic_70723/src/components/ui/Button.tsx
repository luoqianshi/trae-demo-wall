import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "mint" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow-brand hover:shadow-glow-brand hover:-translate-y-0.5",
  mint:
    "bg-gradient-to-br from-mint-400 to-mint-500 text-white shadow-glow-mint hover:-translate-y-0.5",
  secondary:
    "bg-white/80 text-ink-800 border border-ink-200/70 hover:bg-white hover:-translate-y-0.5 shadow-soft",
  outline:
    "bg-transparent text-brand-600 border border-brand-300 hover:bg-brand-50",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-100/70",
  danger:
    "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[0_18px_32px_rgba(244,63,94,0.26)] hover:-translate-y-0.5",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-[15px] gap-2.5 py-3.5",
  icon: "h-10 w-10 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-bold tracking-tight transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
