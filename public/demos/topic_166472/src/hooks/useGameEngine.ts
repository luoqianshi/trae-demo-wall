import { useEffect, useRef, useCallback } from 'react';
import type { Ball, Paddle, Brick, Particle, Star } from '@/types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_HEIGHT,
  PADDLE_BASE_WIDTH,
  BALL_RADIUS,
  BALL_BASE_SPEED,
  BRICK_PADDING,
  BRICK_OFFSET_TOP,
  BRICK_OFFSET_LEFT,
  BRICK_HEIGHT,
} from '@/types/game';
import { LEVELS, BRICK_COLORS } from '@/config/levels';
import { useGameStore } from '@/store/useGameStore';
import { rectBallCollision, paddleBallCollision, allBricksCleared } from '@/utils/collision';
import {
  createStars,
  updateStars,
  createBrickParticles,
  createPaddleSparkParticles,
  updateParticles,
} from '@/utils/particles';

interface EngineState {
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
  particles: Particle[];
  stars: Star[];
  keys: { left: boolean; right: boolean };
  mouseX: number | null;
  launched: boolean;
  frame: number;
}

const HIGHEST_LEVEL = LEVELS.length;

const createBall = (paddle: Paddle, speedMul: number): Ball => {
  const angle = (-Math.PI / 3) - Math.random() * (Math.PI / 6);
  const speed = BALL_BASE_SPEED * speedMul;
  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - BALL_RADIUS - 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: BALL_RADIUS,
    trail: [],
  };
};

const createPaddle = (widthScale: number): Paddle => {
  const width = PADDLE_BASE_WIDTH * widthScale;
  return {
    x: CANVAS_WIDTH / 2 - width / 2,
    y: CANVAS_HEIGHT - 40,
    width,
    height: PADDLE_HEIGHT,
    speed: 9,
  };
};

const createBricks = (levelIdx: number): Brick[] => {
  const cfg = LEVELS[levelIdx];
  const totalWidth = CANVAS_WIDTH - BRICK_OFFSET_LEFT * 2;
  const brickWidth = (totalWidth - BRICK_PADDING * (cfg.cols - 1)) / cfg.cols;
  const bricks: Brick[] = [];

  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      const type = cfg.brickPattern[r]?.[c] ?? 0;
      if (type === 0) continue;
      const palette = BRICK_COLORS[type] ?? BRICK_COLORS[1];
      const hueShift = (r * 35 + c * 8) % 360;
      const baseColor = palette.fill;
      const shifted = shiftHue(baseColor, hueShift);
      bricks.push({
        x: BRICK_OFFSET_LEFT + c * (brickWidth + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
        width: brickWidth,
        height: BRICK_HEIGHT,
        color: shifted,
        glowColor: palette.glow,
        points: palette.points,
        hits: 0,
        maxHits: type,
        visible: true,
      });
    }
  }
  return bricks;
};

const shiftHue = (hex: string, deg: number): string => {
  const { h, s, l } = hexToHsl(hex);
  const nh = (h + deg) % 360;
  return hslToHex(nh, s, l);
};

const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return { h, s, l };
};

const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => {
    const v = Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
    return v;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const useGameEngine = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const stateRef = useRef<EngineState | null>(null);
  const rafRef = useRef<number | null>(null);
  const status = useGameStore((s) => s.status);
  const level = useGameStore((s) => s.level);
  const store = useGameStore;

  const initLevel = useCallback((levelIdx: number) => {
    const cfg = LEVELS[Math.min(levelIdx - 1, HIGHEST_LEVEL - 1)];
    const paddle = createPaddle(cfg.paddleWidthScale);
    const ball = createBall(paddle, cfg.ballSpeedMultiplier);
    stateRef.current = {
      ball,
      paddle,
      bricks: createBricks(levelIdx - 1),
      particles: [],
      stars: stateRef.current?.stars ?? createStars(140),
      keys: { left: false, right: false },
      mouseX: null,
      launched: false,
      frame: 0,
    };
  }, []);

  useEffect(() => {
    if (status === 'playing' || status === 'levelUp') {
      if (!stateRef.current || stateRef.current.bricks.length === 0) {
        initLevel(level);
      }
    }
  }, [status, level, initLevel]);

  useEffect(() => {
    if (!stateRef.current) {
      stateRef.current = {
        ball: createBall(createPaddle(1), 1),
        paddle: createPaddle(1),
        bricks: [],
        particles: [],
        stars: createStars(140),
        keys: { left: false, right: false },
        mouseX: null,
        launched: false,
        frame: 0,
      };
    }
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if ((e.key === ' ' || e.key === 'Enter') && !s.launched) {
        s.launched = true;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        const st = store.getState().status;
        if (st === 'playing') store.getState().pauseGame();
        else if (st === 'paused') store.getState().resumeGame();
      }
    };
    const ku = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [store]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      s.mouseX = (e.clientX - rect.left) * scaleX;
    };
    const onLeave = () => {
      const s = stateRef.current;
      if (s) s.mouseX = null;
    };
    const onDown = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.button === 0 && !s.launched) s.launched = true;
    };
    const onTouch = (e: TouchEvent) => {
      const s = stateRef.current;
      if (!s) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const touch = e.touches[0];
      if (touch) s.mouseX = (touch.clientX - rect.left) * scaleX;
      if (!s.launched) s.launched = true;
      e.preventDefault();
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchmove', onTouch, { passive: false });
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchmove', onTouch);
      canvas.removeEventListener('touchstart', onTouch);
    };
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      const s = stateRef.current;
      if (!s) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      s.frame++;
      const st = store.getState().status;
      updateStars(s.stars);

      if (st === 'playing') {
        stepPhysics(s);
      }
      s.particles = updateParticles(s.particles);
      draw(ctx, s, st);
      rafRef.current = requestAnimationFrame(tick);
    };

    const stepPhysics = (s: EngineState) => {
      const p = s.paddle;
      if (s.keys.left) p.x -= p.speed;
      if (s.keys.right) p.x += p.speed;
      if (s.mouseX !== null) {
        const target = s.mouseX - p.width / 2;
        p.x += (target - p.x) * 0.28;
      }
      p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));

      if (!s.launched) {
        s.ball.x = p.x + p.width / 2;
        s.ball.y = p.y - s.ball.radius - 2;
        return;
      }

      const ball = s.ball;
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 12) ball.trail.shift();

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x + ball.radius > CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
      }

      const hit = paddleBallCollision(p, ball);
      if (hit !== null && ball.vy > 0) {
        const angle = hit * (Math.PI / 3);
        const speed = Math.min(12, Math.hypot(ball.vx, ball.vy) * 1.01);
        ball.vx = Math.sin(angle) * speed + ball.vx * 0.2;
        ball.vy = -Math.abs(Math.cos(angle) * speed);
        ball.y = p.y - ball.radius - 1;
        s.particles.push(...createPaddleSparkParticles(ball.x, p.y, '#00f5ff'));
      }

      for (const br of s.bricks) {
        if (!br.visible) continue;
        const res = rectBallCollision(br, ball);
        if (res.hit) {
          br.hits++;
          if (br.hits >= br.maxHits) {
            br.visible = false;
            s.particles.push(...createBrickParticles(br));
            store.getState().addScore(br.points);
          } else {
            s.particles.push(...createBrickParticles(br).slice(0, 6));
          }
          if (res.side === 'top' || res.side === 'bottom') ball.vy = -ball.vy;
          else if (res.side === 'left' || res.side === 'right') ball.vx = -ball.vx;
          else ball.vy = -ball.vy;
          break;
        }
      }

      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        const alive = store.getState().loseLife();
        if (alive) {
          const cfg = LEVELS[Math.min(store.getState().level - 1, HIGHEST_LEVEL - 1)];
          s.ball = createBall(s.paddle, cfg.ballSpeedMultiplier);
          s.launched = false;
        }
      }

      if (allBricksCleared(s.bricks)) {
        const curLevel = store.getState().level;
        if (curLevel >= HIGHEST_LEVEL) {
          store.getState().endGame(true);
        } else {
          store.getState().setLevelUp();
          setTimeout(() => {
            store.getState().goToNextLevel();
          }, 1400);
        }
      }
    };

    const draw = (ctx: CanvasRenderingContext2D, s: EngineState, st: string) => {
      ctx.fillStyle = '#050816';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const bgGrad = ctx.createRadialGradient(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT * 0.2,
        0,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT * 0.5,
        CANVAS_WIDTH * 0.7
      );
      bgGrad.addColorStop(0, 'rgba(20, 10, 60, 0.5)');
      bgGrad.addColorStop(0.5, 'rgba(5, 8, 22, 0.2)');
      bgGrad.addColorStop(1, 'rgba(5, 8, 22, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (const star of s.stars) {
        const a = star.opacity * (0.55 + 0.45 * Math.sin(star.twinklePhase));
        ctx.fillStyle = `rgba(180, 220, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const br of s.bricks) {
        if (!br.visible) continue;
        const damage = br.hits / br.maxHits;
        ctx.save();
        ctx.shadowColor = br.color;
        ctx.shadowBlur = 16 - damage * 8;
        const grd = ctx.createLinearGradient(br.x, br.y, br.x, br.y + br.height);
        grd.addColorStop(0, lighten(br.color, 0.35));
        grd.addColorStop(0.5, br.color);
        grd.addColorStop(1, darken(br.color, 0.35));
        ctx.fillStyle = grd;
        roundRect(ctx, br.x, br.y, br.width, br.height, 5);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = `rgba(255,255,255,${0.22 - damage * 0.18})`;
        ctx.lineWidth = 1;
        roundRect(ctx, br.x + 0.5, br.y + 0.5, br.width - 1, br.height - 1, 5);
        ctx.stroke();

        if (br.maxHits > 1) {
          const remain = br.maxHits - br.hits;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = 'bold 13px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${remain}`, br.x + br.width / 2, br.y + br.height / 2);
        }
      }

      const trail = s.ball.trail;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const alpha = (i / trail.length) * 0.5;
        const r = s.ball.radius * (0.4 + (i / trail.length) * 0.6);
        ctx.fillStyle = `rgba(0, 245, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 22;
      const ballGrd = ctx.createRadialGradient(
        s.ball.x - 2,
        s.ball.y - 2,
        1,
        s.ball.x,
        s.ball.y,
        s.ball.radius
      );
      ballGrd.addColorStop(0, '#ffffff');
      ballGrd.addColorStop(0.4, '#7cf9ff');
      ballGrd.addColorStop(1, '#00b9c7');
      ctx.fillStyle = ballGrd;
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, s.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const pad = s.paddle;
      ctx.save();
      ctx.shadowColor = '#ff00e5';
      ctx.shadowBlur = 22;
      const padGrd = ctx.createLinearGradient(pad.x, pad.y, pad.x + pad.width, pad.y);
      padGrd.addColorStop(0, '#ff00e5');
      padGrd.addColorStop(0.5, '#00f5ff');
      padGrd.addColorStop(1, '#ff00e5');
      ctx.fillStyle = padGrd;
      roundRect(ctx, pad.x, pad.y, pad.width, pad.height, 8);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      roundRect(ctx, pad.x + 0.5, pad.y + 0.5, pad.width - 1, pad.height - 1, 8);
      ctx.stroke();

      for (const p of s.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (st === 'paused') {
        ctx.fillStyle = 'rgba(5, 8, 22, 0.78)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#00f5ff';
        ctx.font = "bold 56px Orbitron, sans-serif";
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 30;
        ctx.fillText('已暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '18px JetBrains Mono, monospace';
        ctx.fillText('按 ESC 或 P 键继续', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }

      if (st === 'levelUp') {
        const curLevel = store.getState().level;
        const nextName = LEVELS[Math.min(curLevel, HIGHEST_LEVEL - 1)]?.name ?? '';
        ctx.fillStyle = 'rgba(5, 8, 22, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 35;
        ctx.fillStyle = '#ffcc00';
        ctx.font = "bold 48px Orbitron, sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('关卡完成!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px Orbitron, sans-serif';
        ctx.fillText(`进入 ${nextName}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        ctx.restore();
      }

      if (st !== 'playing' && st !== 'paused' && st !== 'levelUp') {
        if (!s.launched && (st === 'menu' || st === 'won' || st === 'lost')) {
          /* noop */
        }
      }

      if (!s.launched && (st === 'playing')) {
        const pulse = 0.6 + 0.4 * Math.sin(s.frame * 0.08);
        ctx.fillStyle = `rgba(255,255,255,${pulse})`;
        ctx.font = '16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('点击 / 按空格 发射小球', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
      }

      const scanAlpha = 0.05 + 0.02 * Math.sin(s.frame * 0.05);
      ctx.fillStyle = `rgba(0,0,0,${scanAlpha})`;
      for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
        ctx.fillRect(0, y, CANVAS_WIDTH, 1);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, store]);

  return { initLevel };
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
};

const lighten = (hex: string, amt: number): string => {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, Math.min(1, s), Math.min(1, l + amt));
};
const darken = (hex: string, amt: number): string => {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, Math.min(1, s), Math.max(0, l - amt));
};
