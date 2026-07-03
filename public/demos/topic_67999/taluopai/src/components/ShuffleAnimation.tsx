import { useEffect, useState } from 'react';
import { useTarotStore } from '@/stores/useTarotStore';
import type { Card, DrawingCard } from '@/../shared/types';

interface Props {
  onComplete?: () => void;
}

export default function ShuffleAnimation({ onComplete }: Props) {
  const { selectedSpread, setDrawnCards, setIsShuffling, setPhase, setIsDrawing } = useTarotStore();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const spreadCount = selectedSpread === 'single' ? 1 : selectedSpread === 'three' ? 3 : 10;

    const drawCards = async () => {
      try {
        setIsDrawing(true);
        const res = await fetch('/api/cards/random', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: spreadCount, spreadType: selectedSpread }),
        });
        if (!res.ok) throw new Error('Failed to draw');
        const data = await res.json();
        setDrawnCards(data.data.cards || data.data);
      } catch {
        // Fallback: fetch all cards and pick random
        try {
          const res = await fetch('/api/cards');
          const data = await res.json();
          const cards = data.data;
          const shuffled = [...cards].sort(() => Math.random() - 0.5);
          setDrawnCards(
            shuffled.slice(0, spreadCount).map((c: Card, i: number) => ({
              id: Date.now() + i,
              cardId: c.id,
              position: i,
              isReversed: Math.random() > 0.5,
              card: c,
            }))
          );
        } catch {
          setDrawnCards([]);
        }
      } finally {
        setIsDrawing(false);
      }
    };

    drawCards();

    const timer = setTimeout(() => {
      setShow(false);
      setIsShuffling(false);
      setPhase('result');
      onComplete?.();
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      {/* Flying cards */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-lg"
          style={{
            width: '60px',
            height: '90px',
            background: `linear-gradient(135deg, #1a0a2e, #2d1040)`,
            border: '1px solid rgba(212,168,83,0.5)',
            boxShadow: '0 0 15px rgba(212,168,83,0.2)',
            animation: `shuffleCard ${1.5 + Math.random() * 2}s ease-in-out ${i * 0.15}s infinite`,
            left: `${20 + Math.random() * 60}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
        />
      ))}

      {/* Sparkle particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`s-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: Math.random() > 0.5 ? '#d4a853' : '#ffffff',
            boxShadow: '0 0 8px rgba(212,168,83,0.6)',
            animation: `sparkle ${1 + Math.random() * 2}s ease-out ${Math.random() * 2}s infinite`,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
        />
      ))}

      {/* Text */}
      <div className="relative z-10 text-center">
        <h2 className="text-3xl font-display text-mystic-gold text-glow animate-pulse-slow mb-2">
          正在洗牌...
        </h2>
        <p className="text-sm text-mystic-silver/60">命运之轮正在转动</p>
      </div>

      <style>{`
        @keyframes shuffleCard {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.8; }
          25% { transform: translate(${30 + Math.random() * 40}px, ${-20 - Math.random() * 30}px) rotate(${10 + Math.random() * 20}deg) scale(1.1); opacity: 1; }
          50% { transform: translate(${-30 - Math.random() * 40}px, ${-40 - Math.random() * 30}px) rotate(${-10 - Math.random() * 20}deg) scale(0.9); opacity: 0.8; }
          75% { transform: translate(${20 + Math.random() * 30}px, ${-60 - Math.random() * 20}px) rotate(${5 + Math.random() * 15}deg) scale(1); opacity: 0.6; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}