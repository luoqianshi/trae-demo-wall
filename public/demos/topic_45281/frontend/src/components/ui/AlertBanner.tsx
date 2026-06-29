import React from "react";
import { AlertTriangle, Shield, CheckCircle, Info } from "lucide-react";

type AlertType = "error" | "warning" | "success" | "info";

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message: string;
  badge?: string;
  className?: string;
}

const alertStyles: Record<AlertType, { icon: typeof AlertTriangle; bgClass: string; textClass: string; iconBg: string }> = {
  error: {
    icon: AlertTriangle,
    bgClass: "bg-error-container/30 border-error/10",
    textClass: "text-on-error-container",
    iconBg: "bg-error-container",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-tertiary-fixed/30 border-tertiary/10",
    textClass: "text-on-tertiary-fixed-variant",
    iconBg: "bg-tertiary-fixed",
  },
  success: {
    icon: CheckCircle,
    bgClass: "bg-secondary-container/20 border-secondary/10",
    textClass: "text-on-secondary-container",
    iconBg: "bg-secondary-container",
  },
  info: {
    icon: Info,
    bgClass: "bg-primary-fixed/20 border-primary/10",
    textClass: "text-primary",
    iconBg: "bg-primary-fixed",
  },
};

const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  title,
  message,
  badge,
  className = "",
}) => {
  const style = alertStyles[type];
  const IconComponent = style.icon;

  return (
    <div
      className={`
        flex items-center gap-5 rounded-xl border p-6
        ${style.bgClass}
        ${className}
      `}
    >
      <div
        className={`
          size-12 rounded-full flex items-center justify-center
          ${style.iconBg}
        `}
      >
        <IconComponent
          size={24}
          className={type === "error" ? "text-error" : type === "warning" ? "text-tertiary" : type === "success" ? "text-secondary" : "text-primary"}
          style={{ fontVariationSettings: "'FILL' 1" }}
        />
      </div>
      <div className="flex flex-col gap-0.5 flex-1">
        <div className="flex items-center gap-2">
          <p className={`font-headline text-base font-bold ${style.textClass}`}>
            {title}
          </p>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-error text-[10px] text-white font-bold uppercase">
              {badge}
            </span>
          )}
        </div>
        <p className={`text-sm ${style.textClass}/80`}>{message}</p>
      </div>
    </div>
  );
};

export default AlertBanner;
