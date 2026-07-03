import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  isShooting: boolean;
  shootX: number;
  shootY: number;
  shootLife: number;
  shootSpeed: number;
}

export default function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 250;
    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.05,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        isShooting: false,
        shootX: 0,
        shootY: 0,
        shootLife: 0,
        shootSpeed: Math.random() * 8 + 4,
      });
    }
    starsRef.current = stars;

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouse);

    let lastShootingTime = 0;
    const draw = (timestamp: number) => {
      const { width, height } = canvas;
      const mouse = mouseRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const mouseOffsetX = (mouse.x - centerX) * 0.003;
      const mouseOffsetY = (mouse.y - centerY) * 0.003;

      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.8);
      grad.addColorStop(0, '#1a0a2e');
      grad.addColorStop(0.5, '#0d1b3e');
      grad.addColorStop(1, '#0d0520');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.twinklePhase += star.twinkleSpeed;
        const alpha = star.opacity * (0.5 + 0.5 * Math.sin(star.twinklePhase));

        if (star.isShooting) {
          star.shootLife -= 0.016;
          star.shootX += star.shootSpeed * 0.8;
          star.shootY += star.shootSpeed * 0.6;
          if (star.shootLife <= 0) {
            star.isShooting = false;
          }
          const sx = star.x + star.shootX + mouseOffsetX * star.size * 0.5;
          const sy = star.y + star.shootY + mouseOffsetY * star.size * 0.5;
          const tailLen = 60;
          const grad2 = ctx.createLinearGradient(sx, sy, sx - star.shootSpeed * 0.8 * tailLen / 60, sy - star.shootSpeed * 0.6 * tailLen / 60);
          grad2.addColorStop(0, `rgba(255,255,255,${alpha})`);
          grad2.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - star.shootSpeed * 0.8 * tailLen / 60, sy - star.shootSpeed * 0.6 * tailLen / 60);
          ctx.strokeStyle = grad2;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
        } else {
          const sx = star.x + mouseOffsetX * star.size * 0.5;
          const sy = star.y + mouseOffsetY * star.size * 0.5;
          ctx.beginPath();
          ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
          if (star.size > 1.5) {
            ctx.beginPath();
            ctx.arc(sx, sy, star.size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212,168,83,${alpha * 0.15})`;
            ctx.fill();
          }
        }
      }

      if (timestamp - lastShootingTime > 3000 + Math.random() * 4000) {
        const idx = Math.floor(Math.random() * stars.length);
        const s = stars[idx];
        if (!s.isShooting) {
          s.isShooting = true;
          s.shootX = 0;
          s.shootY = 0;
          s.shootLife = 0.8 + Math.random() * 0.5;
          s.x = Math.random() * width * 0.8 + width * 0.1;
          s.y = Math.random() * height * 0.3;
          lastShootingTime = timestamp;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}