// Hero 背景 - 极简几何动画（红白风格）

import { useEffect, useRef } from "react";

export default function HeroBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // 柔和的红色光晕（右上角）
      const glow = ctx.createRadialGradient(w * 0.7, h * 0.1, 0, w * 0.7, h * 0.1, Math.min(w, h) * 0.6);
      glow.addColorStop(0, "rgba(255, 59, 48, 0.06)");
      glow.addColorStop(1, "rgba(255, 59, 48, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // 左下的柔和光晕
      const glow2 = ctx.createRadialGradient(w * 0.2, h * 0.8, 0, w * 0.2, h * 0.8, Math.min(w, h) * 0.5);
      glow2.addColorStop(0, "rgba(255, 59, 48, 0.04)");
      glow2.addColorStop(1, "rgba(255, 59, 48, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      // 漂浮的几何图形（极简）
      const cx = w * 0.72;
      const cy = h * 0.55;

      // 缓慢旋转的正六边形轮廓
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((t * 0.002) % (Math.PI * 2));
      ctx.strokeStyle = "rgba(255, 59, 48, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = Math.min(w, h) * 0.16;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // 内部圆
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 0.001);
      ctx.strokeStyle = "rgba(255, 59, 48, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.1, 0, Math.PI * 2);
      ctx.stroke();

      // 内部小圆
      ctx.strokeStyle = "rgba(29, 29, 31, 0.06)";
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.06, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 几个浮动的小圆点（苹果风装饰）
      const dots = [
        { x: w * 0.85, y: h * 0.25, r: 4, color: "rgba(255, 59, 48, 0.3)" },
        { x: w * 0.55, y: h * 0.3, r: 2, color: "rgba(29, 29, 31, 0.1)" },
        { x: w * 0.9, y: h * 0.7, r: 3, color: "rgba(255, 59, 48, 0.2)" },
        { x: w * 0.6, y: h * 0.8, r: 2.5, color: "rgba(29, 29, 31, 0.08)" },
      ];
      dots.forEach((d, i) => {
        const offset = Math.sin((t + i * 50) * 0.02) * 8;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y + offset, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
