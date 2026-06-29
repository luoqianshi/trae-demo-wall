import React, { useEffect, useState } from "react";
import { useCountUp, useInView } from "@/hooks/useAnimation";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  /** Format the number (e.g. toLocaleString) */
  format?: (n: number) => string;
}

/**
 * Number that counts up from 0 when it enters the viewport.
 * Uses IntersectionObserver to trigger only once visible.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = "",
  suffix = "",
  duration = 1200,
  className = "",
  format,
}) => {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [started, setStarted] = useState(false);
  const { count } = useCountUp(value, duration, started);

  useEffect(() => {
    if (inView && !started) setStarted(true);
  }, [inView, started]);

  const display = format ? format(count) : count.toLocaleString();

  return (
    <span ref={ref} className={`tabular-nums ${className}`} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}{display}{suffix}
    </span>
  );
};

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  /** Index for stagger delay calculation */
  index?: number;
  /** Animation variant */
  variant?: "fade-up" | "scale-in" | "fade-left" | "fade-right";
  /** HTML element type */
  as?: React.ElementType;
}

/**
 * Card that animates in when it enters the viewport.
 * Supports staggered entrance via the `index` prop.
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = "",
  index = 0,
  variant = "fade-up",
  as: Tag = "div",
}) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const animClass = inView ? `anim-${variant}` : "opacity-0";

  const style = { animationDelay: `${index * 0.08}s` };

  return (
    <Tag
      ref={ref as any}
      className={`${animClass} ${className}`}
      style={inView ? style : undefined}
    >
      {children}
    </Tag>
  );
};

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  /** CSS class for each child wrapper */
  childClassName?: string;
  /** Animation variant for children */
  variant?: "fade-up" | "scale-in" | "fade-left";
  /** Per-child stagger delay in ms */
  staggerMs?: number;
}

/**
 * List where children enter one-by-one with staggered timing.
 * Uses CSS animation classes + inline animationDelay.
 */
export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  className = "",
  childClassName = "",
  variant = "fade-up",
  staggerMs = 80,
}) => {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <div
          className={`${childClassName} ${inView ? `anim-${variant}` : "opacity-0"}`}
          style={inView ? { animationDelay: `${i * staggerMs}ms` } : undefined}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

interface StatusPulseProps {
  /** "online" | "warning" | "error" | "idle" */
  status?: "online" | "warning" | "error" | "idle";
  size?: number;
  className?: string;
}

const statusColors: Record<string, string> = {
  online: "bg-green-400",
  warning: "bg-yellow-400",
  error: "bg-red-400",
  idle: "bg-gray-300",
};

/**
 * Pulsing status indicator dot. Green pulse = online/active.
 */
export const StatusPulse: React.FC<StatusPulseProps> = ({
  status = "online",
  size = 10,
  className = "",
}) => (
  <span className={`relative flex items-center justify-center ${className}`}>
    <span
      className={`absolute rounded-full ${statusColors[status]} opacity-30`}
      style={{
        width: size * 2.5,
        height: size * 2.5,
        animation: status === "online" ? "pulse-glow 2s ease-in-out infinite" : "none",
      }}
    />
    <span
      className={`relative rounded-full ${statusColors[status]}`}
      style={{ width: size, height: size }}
    />
  </span>
);
