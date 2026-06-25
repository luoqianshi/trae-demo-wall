import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ICONS } from "@/lib/icons";
import { CAREERS } from "@/data/careers";

interface MouseState {
  x: number;
  y: number;
}

type IconType = LucideIcon;

const ORBIT_ICONS: IconType[] = [
  ICONS.BrainCircuit,
  ICONS.Palette,
  ICONS.TrendingUp,
  ICONS.HeartPulse,
  ICONS.Rocket,
  ICONS.Code2,
  ICONS.Briefcase,
  ICONS.Microscope,
];

const COLOR_MAP: Record<string, string> = {
  cyan: "#00f0ff",
  magenta: "#ff2e88",
  gold: "#ffb800",
  green: "#39ff14",
};

/**
 * 首页全息动态场景：多层视差 + 旋转星球 + 轨道图标 + 星座连线 + 粒子流
 */
export default function HolographicScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<MouseState>({ x: 0.5, y: 0.5 });
  const [dims, setDims] = useState({ width: 1, height: 1 });

  const springConfig = { stiffness: 60, damping: 30 };
  const sx = useSpring(mouse.x, springConfig);
  const sy = useSpring(mouse.y, springConfig);

  // 各层视差
  const farX = useTransform(sx, [0, 1], [-40, 40]);
  const farY = useTransform(sy, [0, 1], [-30, 30]);
  const midX = useTransform(sx, [0, 1], [-20, 20]);
  const midY = useTransform(sy, [0, 1], [-15, 15]);
  const nearX = useTransform(sx, [0, 1], [-10, 10]);
  const nearY = useTransform(sy, [0, 1], [-8, 8]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDims({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMouse({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // 让 spring 跟随鼠标
  useEffect(() => {
    sx.set(mouse.x);
    sy.set(mouse.y);
  }, [mouse, sx, sy]);

  const careerNodes = useMemo(() => {
    return CAREERS.slice(0, 12).map((career, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 28 + (i % 3) * 7;
      const x = 50 + Math.cos(angle) * radius;
      const y = 45 + Math.sin(angle) * radius * 0.7;
      const Icon = ICONS[career.icon] || ICONS.Circle;
      return { id: career.id, x, y, color: career.accentColor, Icon };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ===== Layer 0: 深空星云渐变 ===== */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(0,240,255,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(255,46,136,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(255,184,0,0.05),transparent_40%)]" />

      {/* ===== Layer 1: 缓慢旋转的星球骨架（最远，视差最大） ===== */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ x: farX, y: farY }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="relative h-[700px] w-[700px] opacity-45"
        >
          {/* 星球经纬线 */}
          <svg viewBox="0 0 700 700" className="h-full w-full">
            <defs>
              <linearGradient id="sphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ff2e88" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <circle cx="350" cy="350" r="280" fill="none" stroke="url(#sphereGrad)" strokeWidth="1" />
            {[...Array(7)].map((_, i) => (
              <ellipse
                key={`lat-${i}`}
                cx="350"
                cy="350"
                rx={40 + i * 40}
                ry={10 + i * 12}
                fill="none"
                stroke="rgba(0,240,255,0.08)"
                strokeWidth="1"
              />
            ))}
            {[...Array(5)].map((_, i) => (
              <ellipse
                key={`lon-${i}`}
                cx="350"
                cy="350"
                rx={120 + i * 30}
                ry={280}
                fill="none"
                stroke="rgba(255,46,136,0.06)"
                strokeWidth="1"
                transform={`rotate(${i * 36} 350 350)`}
              />
            ))}
          </svg>
        </motion.div>
      </motion.div>

      {/* ===== Layer 2: 轨道光环与中景星座 ===== */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ x: midX, y: midY }}
      >
        {/* 外环 */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="relative h-[520px] w-[520px] rounded-full border border-white/[0.08]"
          style={{ boxShadow: "0 0 80px rgba(0,240,255,0.08)" }}
        >
          {/* 轨道上漂浮的职业图标 */}
          {ORBIT_ICONS.map((Icon, i) => {
            const angle = (i / ORBIT_ICONS.length) * Math.PI * 2;
            const r = 260;
            const x = Math.cos(angle) * r + r - 14;
            const y = Math.sin(angle) * r + r - 14;
            return (
              <motion.div
                key={i}
                className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm"
                style={{ left: x, top: y }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.85, 0.4] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className="h-3.5 w-3.5 text-white/70" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* 内环 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 m-auto h-[360px] w-[360px] rounded-full border border-dashed border-white/[0.08]"
        />
      </motion.div>

      {/* ===== Layer 3: 职业星座连线 ===== */}
      <motion.div
        className="absolute inset-0"
        style={{ x: nearX, y: nearY }}
      >
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
              <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ff2e88" stopOpacity="0" />
            </linearGradient>
          </defs>
          {careerNodes.map((node, i) => {
            const next = careerNodes[(i + 1) % careerNodes.length];
            return (
              <motion.line
                key={`line-${node.id}`}
                x1={node.x}
                y1={node.y}
                x2={next.x}
                y2={next.y}
                stroke={COLOR_MAP[node.color] || "url(#lineGrad)"}
                strokeWidth="0.08"
                strokeOpacity="0.55"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: i * 0.1, ease: "easeInOut" }}
              />
            );
          })}
        </svg>

        {/* 职业节点 */}
        {careerNodes.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-sm"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            >
              <node.Icon className="h-4 w-4 text-white/80" />
            </motion.div>
            <div className="mt-1 h-1 w-1 rounded-full bg-white/30" />
          </motion.div>
        ))}
      </motion.div>

      {/* ===== Layer 4: 向中心汇聚的粒子流 ===== */}
      <ParticleStream width={dims.width} height={dims.height} />

      {/* ===== Layer 5: 前景光晕 ===== */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#05070f] via-[#05070f]/80 to-transparent" />
    </div>
  );
}

/* ================================================================
   Particle Stream: 粒子向屏幕中心汇聚
   ================================================================ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  speed: number;
}

function ParticleStream({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width < 10 || height < 10) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = width / 2;
    const centerY = height / 2;
    const count = Math.min(80, Math.floor((width * height) / 18000));

    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(width, height) * (0.5 + Math.random() * 0.5);
      return {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        speed: 0.3 + Math.random() * 0.6,
      };
    });

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        p.vx = Math.cos(angle) * p.speed * (1 + 200 / (dist + 1));
        p.vy = Math.sin(angle) * p.speed * (1 + 200 / (dist + 1));

        p.x += p.vx;
        p.y += p.vy;

        if (dist < 30 || p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.max(width, height) * (0.5 + Math.random() * 0.5);
          p.x = centerX + Math.cos(a) * d;
          p.y = centerY + Math.sin(a) * d;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 234, 212, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(0, 240, 255, 0.5)";
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
