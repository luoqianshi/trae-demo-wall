import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

/**
 * 3D 倾斜卡片：鼠标移动时卡片倾斜，内部光晕跟随鼠标
 */
export default function TiltCard({
  children,
  className,
  glowColor = "rgba(0, 240, 255, 0.35)",
  intensity = 14,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 300, damping: 25 };
  const rx = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), springConfig);
  const ry = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), springConfig);

  // 直接生成完整背景字符串，避免 CSS 变量单位问题
  const background = useTransform(
    [x, y],
    ([latestX, latestY]) =>
      `radial-gradient(circle at ${(latestX as number) * 100}% ${(latestY as number) * 100}%, ${glowColor}, transparent 40%)`
  );

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      className={cn("group relative", className)}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* 跟随鼠标的光晕 */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
