import { useEffect, useRef, useMemo } from 'react';

interface StarFieldProps {
  density?: number;
  className?: string;
  twinkle?: boolean;
}

export default function StarField({ density = 60, className = '', twinkle = true }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const stars = useMemo(() => 
    Array.from({ length: density }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.0005 + 0.0002,
      phase: Math.random() * Math.PI * 2,
    })),
    [density]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;
      
      stars.forEach((star) => {
        const opacity = twinkle 
          ? star.opacity * (0.6 + 0.4 * Math.sin(time * star.speed * 10 + star.phase))
          : star.opacity;
        ctx.beginPath();
        ctx.arc(star.x * canvas.width, star.y * canvas.height, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 236, 224, ${opacity})`;
        ctx.fill();
        
        if (star.size > 1.5) {
          ctx.beginPath();
          ctx.arc(star.x * canvas.width, star.y * canvas.height, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240, 236, 224, ${opacity * 0.08})`;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [stars, twinkle]);

  return <canvas ref={canvasRef} className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
