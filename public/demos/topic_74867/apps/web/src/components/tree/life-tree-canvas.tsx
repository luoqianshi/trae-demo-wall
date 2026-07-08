'use client';

import { useEffect, useRef, useCallback } from 'react';

interface TreeConfig {
  seed: number;
  branches: number;
  depth: number;
  growth: number; // 0-1 growth progress
}

export default function LifeTreeCanvas({ config }: { config?: TreeConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);

  const treeConfig = config ?? { seed: 42, branches: 2, depth: 8, growth: 0.3 };

  const drawBranch = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    length: number,
    angle: number,
    depth: number,
    maxDepth: number,
    time: number,
  ) => {
    if (depth <= 0) return;

    const growth = treeConfig.growth;
    const effectiveLength = length * growth * (1 - (maxDepth - depth) / maxDepth * 0.3);

    // Mouse influence on branch angle
    const canvas = canvasRef.current;
    if (canvas) {
      const dx = mouseRef.current.x - canvas.width / 2;
      const dy = mouseRef.current.y - canvas.height * 0.85;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / 300) * 0.02;
      angle += influence * (dx / 300);
    }

    // Breathing sway
    const sway = Math.sin(time * 0.001 + depth * 0.5) * 0.02 * (maxDepth - depth + 1);
    const endX = x + Math.cos(angle + sway) * effectiveLength;
    const endY = y + Math.sin(angle + sway) * effectiveLength;

    // Branch thickness
    const thickness = depth * 1.2 * growth;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';

    // Branch color gradient
    const trunkColor = `rgba(${139 + depth * 8}, ${90 + depth * 5}, ${43 + depth * 3}, ${0.4 + depth / maxDepth * 0.4})`;
    ctx.strokeStyle = trunkColor;
    ctx.shadowColor = 'rgba(74, 222, 128, 0.1)';
    ctx.shadowBlur = depth > 3 ? 8 : 0;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw leaves at tips
    if (depth <= 3) {
      const leafCount = Math.floor(2 + growth * 3);
      for (let i = 0; i < leafCount; i++) {
        const leafAngle = angle + (Math.random() - 0.5) * 1.2;
        const leafDist = effectiveLength * (0.6 + Math.random() * 0.4);
        const lx = endX + Math.cos(leafAngle) * leafDist;
        const ly = endY + Math.sin(leafAngle) * leafDist;

        // Leaf breathing
        const leafPulse = 1 + Math.sin(time * 0.002 + i + depth) * 0.15;
        const leafSize = (3 + growth * 4) * leafPulse;

        const leafHue = 120 + Math.sin(time * 0.001 + depth) * 15;
        const leafAlpha = 0.3 + growth * 0.4;

        ctx.fillStyle = `hsla(${leafHue}, 70%, 55%, ${leafAlpha})`;
        ctx.shadowColor = `hsla(${leafHue}, 70%, 55%, 0.3)`;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.ellipse(lx, ly, leafSize, leafSize * 0.6, leafAngle, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Recursive branches
    if (depth > 1) {
      const branchAngle = 0.4 + Math.sin(depth * 0.7) * 0.15;
      const newLength = length * 0.75;

      drawBranch(ctx, endX, endY, newLength, angle - branchAngle, depth - 1, maxDepth, time);
      drawBranch(ctx, endX, endY, newLength, angle + branchAngle, depth - 1, maxDepth, time);
    }
  }, [treeConfig]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      timeRef.current += 16;
      const time = timeRef.current;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Ground glow
      const groundGrad = ctx.createRadialGradient(
        rect.width / 2, rect.height * 0.85, 0,
        rect.width / 2, rect.height * 0.85, rect.width * 0.4
      );
      groundGrad.addColorStop(0, 'rgba(74, 222, 128, 0.04)');
      groundGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw tree
      const trunkLength = rect.height * 0.18 * treeConfig.growth;
      const startX = rect.width / 2;
      const startY = rect.height * 0.85;

      // Root glow
      const rootGrad = ctx.createRadialGradient(startX, startY, 0, startX, startY, 30);
      rootGrad.addColorStop(0, 'rgba(139, 90, 43, 0.3)');
      rootGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rootGrad;
      ctx.beginPath();
      ctx.arc(startX, startY, 30, 0, Math.PI * 2);
      ctx.fill();

      drawBranch(ctx, startX, startY, trunkLength, -Math.PI / 2, treeConfig.depth, treeConfig.depth, time);

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [drawBranch, treeConfig]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,5,8,0.4) 100%)',
        }}
      />
    </div>
  );
}
