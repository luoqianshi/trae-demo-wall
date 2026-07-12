import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockCharacters } from '../data/characters';

/* ---------- position allocator: spreads avatars evenly around edges ---------- */
function generatePositions(count: number) {
  // distribute around the viewport perimeter, avoiding center
  const configs: Array<{
    char: (typeof mockCharacters)[0];
    left?: string; right?: string; top?: string; bottom?: string;
    size: number; delay: number; floatY: number; floatDur: number;
  }> = [];
  const corners = [
    { left: '5%',  top: '8%' },
    { right: '6%', top: '10%' },
    { right: '6%', bottom: '15%' },
    { left: '4%', bottom: '18%' },
    { right: '11%', top: '48%' },
    { left: '9%',  top: '54%' },
    { left: '15%', top: '25%' },
    { right: '14%', top: '30%' },
    { left: '5%', top: '35%' },
    { right: '8%', bottom: '40%' },
    { left: '12%', bottom: '35%' },
    { right: '5%', top: '25%' },
  ];
  for (let i = 0; i < count; i++) {
    const pos = corners[i % corners.length];
    configs.push({
      char: mockCharacters[i % mockCharacters.length],
      ...pos,
      size: 36 + (i % 5) * 5,
      delay: i * 0.15,
      floatY: 5 + (i % 4) * 2,
      floatDur: 3.5 + (i % 3) * 0.6,
    });
  }
  return configs;
}

/* ---------- floating avatar component ---------- */
function FloatingAvatar({
  char,
  size,
  delay,
  floatY,
  floatDur,
  style,
}: {
  char: (typeof mockCharacters)[0];
  size: number;
  delay: number;
  floatY: number;
  floatDur: number;
  style: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1, y: [0, -floatY, 0] }}
      transition={{
        opacity: { delay, duration: 0.8 },
        scale: { delay, duration: 0.8, type: 'spring', stiffness: 120 },
        y: { delay: delay + 0.5, duration: floatDur, repeat: Infinity, ease: 'easeInOut' },
      }}
      whileHover={{ scale: 1.25, zIndex: 50 }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        zIndex: 3,
        ...style,
      }}
    >
      {/* outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: -6,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,168,96,0.2) 0%, rgba(200,168,96,0.06) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* avatar */}
      {char.avatarImage ? (
        <img
          src={char.avatarImage}
          alt={char.name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            border: '1.5px solid rgba(255,255,255,0.15)',
            boxShadow: '0 0 16px rgba(0,0,0,0.5), 0 0 4px rgba(200,168,96,0.15)',
          }}
          draggable={false}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: char.avatar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,0.15)',
          }}
        >
          <span style={{ fontSize: size * 0.4, color: '#fff', fontWeight: 600 }}>
            {char.name.charAt(0)}
          </span>
        </div>
      )}
      {/* name tooltip on hover */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          bottom: -22,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.06em',
          pointerEvents: 'none',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        {char.name}
      </motion.div>
    </motion.div>
  );
}

/* ---------- particle nebula canvas ---------- */
function ParticleNebula() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<ReturnType<typeof createParticles> | null>(null);
  const animRef = useRef<number>(0);

  const PARTICLE_COUNT = 500;
  const MOUSE_RADIUS = 130;
  const MOUSE_FORCE = 0.06;

  const createParticles = useCallback((w: number, h: number) => {
    const colors = [
      [240, 236, 224], // star-white
      [200, 168, 96],  // gold
      [245, 230, 200], // warm-light
      [212, 165, 116], // caramel
      [180, 160, 130], // muted
    ];
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isGold = Math.random() < 0.12;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        ox: 0,
        oy: 0,
        size: isGold ? Math.random() * 2.5 + 1.2 : Math.random() * 1.8 + 0.3,
        alpha: isGold ? Math.random() * 0.5 + 0.3 : Math.random() * 0.5 + 0.15,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.004 + 0.002,
        color: colors[Math.floor(Math.random() * colors.length)],
        isGold,
      });
      particles[i].ox = particles[i].x;
      particles[i].oy = particles[i].y;
    }
    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap!.clientWidth;
      H = wrap!.clientHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = createParticles(W, H);
    }

    resize();

    const startTime = performance.now();

    function animate(now: number) {
      const t = now - startTime;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      if (!particles) { animRef.current = requestAnimationFrame(animate); return; }

      ctx!.clearRect(0, 0, W, H);

      // draw connections between gold particles
      for (let i = 0; i < particles.length; i++) {
        if (!particles[i].isGold) continue;
        for (let j = i + 1; j < particles.length; j++) {
          if (!particles[j].isGold) continue;
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 8100) { // 90^2
            const dist = Math.sqrt(distSq);
            const a = (1 - dist / 90) * 0.05;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(200,168,96,${a})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // update & draw particles
      for (const p of particles) {
        p.phase += p.speed;
        p.x += p.vx + Math.sin(p.phase) * 0.04;
        p.y += p.vy + Math.cos(p.phase * 0.7) * 0.03;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < MOUSE_RADIUS * MOUSE_RADIUS && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
          p.x -= dx * force;
          p.y -= dy * force;
        }

        p.x += (p.ox - p.x) * 0.003;
        p.y += (p.oy - p.y) * 0.003;

        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;

        const twinkle = Math.sin(t * 0.003 + p.phase) * 0.3 + 0.7;
        const a = p.alpha * twinkle;
        const [r, g, b] = p.color;

        if (p.isGold) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${r},${g},${b},${a * 0.06})`;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    function onMouseMove(e: MouseEvent) {
      const rect = wrap!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }
    function onResize() {
      resize();
    }

    wrap.addEventListener('mousemove', onMouseMove);
    wrap.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      wrap.removeEventListener('mousemove', onMouseMove);
      wrap.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
    };
  }, [createParticles]);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

/* ---------- main welcome page ---------- */
export default function PageWelcome() {
  const navigate = useNavigate();
  const avatarConfigs = useMemo(() => generatePositions(mockCharacters.length), []);

  return (
    <div
      className="w-full h-screen overflow-hidden cursor-pointer relative"
      onClick={() => navigate('/home')}
      style={{ background: 'var(--bg-deep, #050505)' }}
    >
      {/* Particle nebula background */}
      <ParticleNebula />

      {/* Floating character avatars - mixed into the nebula */}
      {avatarConfigs.map((cfg) => (
        <FloatingAvatar
          key={cfg.char.id}
          char={cfg.char}
          size={cfg.size}
          delay={cfg.delay}
          floatY={cfg.floatY}
          floatDur={cfg.floatDur}
          style={{
            left: cfg.left,
            right: cfg.right,
            top: cfg.top,
            bottom: cfg.bottom,
          }}
        />
      ))}

      {/* Central content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* nebula glow behind title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.06, 0.16, 0.06] }}
          transition={{ delay: 0.5, duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 'clamp(200px, 45vw, 400px)',
            height: 'clamp(200px, 45vw, 400px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,168,96,0.1) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            color: 'var(--star-white, #F0ECE0)',
            letterSpacing: '0.06em',
            fontWeight: 300,
            lineHeight: 1.1,
            textAlign: 'center',
            textShadow: '0 2px 40px rgba(0,0,0,0.7)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          my pc echo
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.9rem, 2.4vw, 1.2rem)',
            color: 'rgba(200,200,200,0.85)',
            marginTop: '1.2rem',
            letterSpacing: '0.14em',
            textShadow: '0 1px 12px rgba(0,0,0,0.6)',
          }}
        >
          每一个自己，都有回响。
        </motion.p>

        {/* hint text */}
        <motion.p
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            position: 'absolute',
            bottom: '12%',
            fontSize: '0.75rem',
            color: 'rgba(200,168,96,0.5)',
            letterSpacing: '0.12em',
          }}
        >
          轻触继续
        </motion.p>
      </div>
    </div>
  );
}
