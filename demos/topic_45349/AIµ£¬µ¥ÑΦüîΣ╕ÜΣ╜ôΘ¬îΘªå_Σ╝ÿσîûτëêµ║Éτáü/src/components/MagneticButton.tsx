import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import NeonButton from "./NeonButton";
import type { ButtonHTMLAttributes } from "react";

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  strength?: number;
}

/**
 * 磁吸按钮：鼠标靠近时按钮被轻微吸引
 * 外层 hit area 比按钮大，让磁吸在靠近时就开始生效
 */
export default function MagneticButton({
  children,
  strength = 0.25,
  className,
  ...props
}: MagneticButtonProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 180, damping: 12, mass: 0.12 };
  const sx = useSpring(x, springConfig);
  const sy = useSpring(y, springConfig);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    x.set(distX * strength);
    y.set(distY * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={areaRef}
      className="inline-flex cursor-pointer p-4"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div style={{ x: sx, y: sy }}>
        <NeonButton className={className} {...props}>
          {children}
        </NeonButton>
      </motion.div>
    </motion.div>
  );
}
