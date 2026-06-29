import React, { useEffect, useRef } from "react";

interface AnimatedBackgroundProps {
  /** Primary gradient colors (hue values 0-360) */
  hue1?: number;
  hue2?: number;
  hue3?: number;
  /** Animation duration in seconds */
  duration?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Animated gradient background with smoothly shifting colors.
 * Uses CSS custom properties for hardware-accelerated animation.
 */
const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  hue1 = 330,
  hue2 = 290,
  hue3 = 350,
  duration = 20,
  className = "",
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let start: number;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = ((timestamp - start) / (duration * 1000)) % 1;

      const h1 = (hue1 + progress * 30) % 360;
      const h2 = (hue2 + progress * 20) % 360;
      const h3 = (hue3 + progress * 25) % 360;

      el.style.background = `
        linear-gradient(
          135deg,
          hsl(${h1}, 70%, 92%) 0%,
          hsl(${h2}, 60%, 88%) 40%,
          hsl(${h3}, 65%, 94%) 70%,
          hsl(${h1}, 55%, 90%) 100%
        )
      `;

      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [hue1, hue2, hue3, duration]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedBackground;
