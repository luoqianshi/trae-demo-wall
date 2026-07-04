import React from "react";
import { Loader2 } from "lucide-react";

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  ripple?: boolean;
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
  secondary: "bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10",
  ghost: "text-on-surface-variant hover:bg-primary/5 hover:text-primary",
  danger: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm",
  success: "bg-success text-success-foreground hover:opacity-90 shadow-sm",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-2.5 text-base rounded-2xl gap-2.5",
};

/**
 * Token-based button with consistent press feedback and loading state.
 */
const MotionButton: React.FC<MotionButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  ripple: _ripple = false,
  className = "",
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    props.onClick?.(e);
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`
        motion-press
        inline-flex items-center justify-center
        font-medium
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading && <Loader2 className="animate-spin shrink-0" size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
};

export default MotionButton;
