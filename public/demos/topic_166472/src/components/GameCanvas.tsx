import { useRef } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/game';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGameEngine(canvasRef);

  return (
    <div className="relative w-full max-w-[800px] mx-auto">
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        boxShadow: '0 0 60px rgba(0, 245, 255, 0.18), 0 0 120px rgba(255, 0, 229, 0.08), inset 0 0 0 2px rgba(0, 245, 255, 0.35)',
      }} />
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-auto block rounded-2xl bg-[#050816] touch-none"
        style={{
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          maxHeight: '80vh',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
