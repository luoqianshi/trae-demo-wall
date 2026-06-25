import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  badge?: string;
  badgeType?: "success" | "warning" | "error" | "info" | "primary";
  className?: string;
}

const variantStyles = {
  default: {
    card: "bg-surface-container-lowest border-slate-200",
    iconBg: "bg-pink-50 text-primary",
    value: "text-on-surface",
    trend: {
      up: "text-secondary",
      down: "text-error",
    },
  },
  primary: {
    card: "gradient-primary text-on-primary",
    iconBg: "bg-white/20 text-white",
    value: "text-white",
    trend: {
      up: "text-green-300",
      down: "text-red-300",
    },
  },
  success: {
    card: "bg-secondary-container/20 border-secondary-container/30",
    iconBg: "bg-secondary-container text-on-secondary",
    value: "text-on-surface",
    trend: {
      up: "text-secondary",
      down: "text-error",
    },
  },
  warning: {
    card: "bg-tertiary-fixed/30 border-tertiary-fixed/40",
    iconBg: "bg-tertiary-fixed text-on-tertiary-fixed",
    value: "text-on-surface",
    trend: {
      up: "text-secondary",
      down: "text-error",
    },
  },
  error: {
    card: "bg-error-container/20 border-error-container/30",
    iconBg: "bg-error-container text-on-error-container",
    value: "text-on-surface",
    trend: {
      up: "text-secondary",
      down: "text-error",
    },
  },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = "较昨日",
  variant = "default",
  badge,
  badgeType = "info",
  className = "",
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={`
        p-6 rounded-xl border border-outline-variant/10 medical-glow hover:shadow-lg transition-shadow
        flex flex-col justify-between
        ${styles.card}
        ${className}
      `}
    >
      <div className="flex justify-between items-start">
        {Icon && (
          <div className={`p-2.5 rounded-lg ${styles.iconBg}`}>
            <Icon size={22} />
          </div>
        )}
        {trend !== undefined && (
          <span
            className={`text-xs font-bold flex items-center gap-1 ${
              trend > 0 ? styles.trend.up : styles.trend.down
            }`}
          >
            {trend > 0 ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {Math.abs(trend)}%
          </span>
        )}
        {badge && (
          <span
            className={`
              px-2 py-0.5 text-[10px] font-bold rounded-full
              ${
                badgeType === "error"
                  ? "bg-error text-on-error"
                  : badgeType === "warning"
                  ? "bg-warning text-on-warning"
                  : badgeType === "success"
                  ? "bg-success text-on-success"
                  : badgeType === "primary"
                  ? "bg-primary text-on-primary"
                  : "bg-info text-on-info"
              }
            `}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={`text-3xl font-extrabold font-headline tracking-tight ${styles.value}`}>
          {value}
        </p>
        <p className="text-sm font-medium text-on-surface-variant mt-1">{title}</p>
      </div>
    </div>
  );
};

export default StatCard;
