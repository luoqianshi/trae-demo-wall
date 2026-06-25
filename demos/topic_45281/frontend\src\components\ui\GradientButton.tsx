import React from "react";
import { Loader2 } from "lucide-react";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "gradient-primary text-on-primary shadow-md hover:shadow-lg hover:brightness-110 active:scale-95",
    secondary: "bg-surface-container-low text-primary border border-outline-variant/30 hover:bg-surface-container transition-colors",
    outline: "bg-transparent text-primary border border-primary/30 hover:bg-primary-fixed/10 transition-colors",
    ghost: "bg-transparent text-primary hover:bg-surface-container-low transition-colors",
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={size === "sm" ? 14 : size === "md" ? 16 : 18} className="animate-spin" />}
      {!loading && icon && iconPosition === "left" && icon}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
    </button>
  );
};

export default GradientButton;
