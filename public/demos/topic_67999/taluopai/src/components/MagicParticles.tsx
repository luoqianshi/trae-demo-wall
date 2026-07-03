import { useMemo } from 'react';

interface Particle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  xDrift: number;
}

interface Props {
  count?: number;
  area?: 'wide' | 'narrow';
}

export default function MagicParticles({ count = 20, area = 'narrow' }: Props) {
  const particles = useMemo<Particle[]>(() => {
    const range = area === 'wide' ? 80 : 40;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: 50 + (Math.random() - 0.5) * range,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 3,
      xDrift: (Math.random() - 0.5) * 20,
    }));
  }, [count, area]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: '0%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.size > 3 ? '#d4a853' : '#ffffff',
            opacity: 0,
            boxShadow: `0 0 ${p.size * 2}px rgba(212,168,83,0.5)`,
            animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            '--drift': `${p.xDrift}px`,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.3; }
          100% { transform: translateY(-200px) translateX(var(--drift)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}