import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  padding = "md",
}) => {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const variantStyles = {
    default: "bg-surface-container-lowest border border-outline-variant/10 shadow-custom",
    elevated: "bg-surface-container-lowest shadow-[0_12px_32px_-4px_var(--shadow-color)]",
    outlined: "bg-surface-container-lowest border border-outline-variant/20",
    gradient: "gradient-primary text-on-primary shadow-lg shadow-primary/20",
  };

  return (
    <div
      className={`
        rounded-xl
        ${paddingStyles[padding]}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  className = "",
}) => {
  return (
    <div className={`flex justify-between items-start mb-6 ${className}`}>
      <div className="flex items-start gap-4">
        {icon && (
          <div className="p-2.5 rounded-lg bg-primary-fixed text-primary">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-on-surface font-headline">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
};

interface CardSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const CardSection: React.FC<CardSectionProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <div className={`py-6 ${className}`}>
      {title && (
        <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`
        glass-panel rounded-xl border border-white/20
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardSection, GlassPanel };
