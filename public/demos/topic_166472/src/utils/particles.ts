import type { Particle, Star, Brick } from '@/types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/game';

export const createStars = (count: number): Star[] => {
  return Array.from({ length: count }, () => ({
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_HEIGHT,
    size: Math.random() * 1.8 + 0.3,
    speed: Math.random() * 0.25 + 0.05,
    opacity: Math.random() * 0.6 + 0.3,
    twinkleSpeed: Math.random() * 0.03 + 0.008,
    twinklePhase: Math.random() * Math.PI * 2,
  }));
};

export const updateStars = (stars: Star[]): void => {
  for (const s of stars) {
    s.y += s.speed;
    s.twinklePhase += s.twinkleSpeed;
    if (s.y > CANVAS_HEIGHT) {
      s.y = 0;
      s.x = Math.random() * CANVAS_WIDTH;
    }
  }
};

export const createBrickParticles = (brick: Brick, count = 18): Particle[] => {
  const cx = brick.x + brick.width / 2;
  const cy = brick.y + brick.height / 2;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 1.5 + Math.random() * 3.5;
    particles.push({
      x: cx + (Math.random() - 0.5) * brick.width * 0.6,
      y: cy + (Math.random() - 0.5) * brick.height * 0.6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 40 + Math.random() * 20,
      color: brick.color,
      size: 2 + Math.random() * 3,
    });
  }
  return particles;
};

export const createPaddleSparkParticles = (x: number, y: number, color: string): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    const speed = 1 + Math.random() * 2.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 22 + Math.random() * 12,
      color,
      size: 1.5 + Math.random() * 2,
    });
  }
  return particles;
};

export const updateParticles = (particles: Particle[]): Particle[] => {
  const alive: Particle[] = [];
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.vx *= 0.98;
    p.life -= 1 / p.maxLife;
    if (p.life > 0) alive.push(p);
  }
  return alive;
};
