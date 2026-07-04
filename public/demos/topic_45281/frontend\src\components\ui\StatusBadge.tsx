import React from "react";

type StatusType = "success" | "warning" | "error" | "info" | "neutral" | "primary" | "secondary";

interface StatusBadgeProps {
  type?: StatusType;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const statusStyles: Record<StatusType, string> = {
  success: "bg-green-50 text-green-700 border-green-100",
  warning: "bg-orange-50 text-orange-700 border-orange-100",
  error: "bg-red-50 text-red-700 border-red-100",
  info: "bg-pink-50 text-pink-700 border-pink-100",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
  primary: "bg-primary-fixed text-primary border-primary/20",
  secondary: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
};

const dotStyles: Record<StatusType, string> = {
  success: "bg-green-500",
  warning: "bg-orange-500",
  error: "bg-destructive",
  info: "bg-pink-500",
  neutral: "bg-slate-400",
  primary: "bg-primary",
  secondary: "bg-secondary",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = "info",
  children,
  className = "",
  dot = true,
}) => {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-[10px] font-bold uppercase tracking-wider
        border
        ${statusStyles[type]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles[type]}`}
        />
      )}
      {children}
    </span>
  );
};

export default StatusBadge;
