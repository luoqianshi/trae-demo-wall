import React from "react";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  /** Opacity of the glass effect (0-1, default 0.85) */
  opacity?: number;
  /** Blur amount in px (default 12) */
  blur?: number;
  /** Border opacity (0-1, default 0.15) */
  borderOpacity?: number;
  as?: React.ElementType;
}

/**
 * Glass morphism panel with backdrop blur and semi-transparent background.
 */
const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  opacity = 0.85,
  blur = 12,
  borderOpacity = 0.15,
  as: Tag = "div",
}) => {
  return (
    <Tag
      className={className}
      style={{
        background: `color-mix(in srgb, var(--card) ${opacity * 100}%, transparent)`,
        backdropFilter: `blur(${blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
        borderColor: `color-mix(in srgb, var(--primary) ${borderOpacity * 100}%, transparent)`,
      }}
    >
      {children}
    </Tag>
  );
};

export default GlassPanel;
