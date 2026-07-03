import { useState } from 'react';
import type { Card } from '@/../shared/types';
import CardFace from './CardFace';
import CardBack from './CardBack';

interface Props {
  card: Card;
  isReversed?: boolean;
  index?: number;
  delay?: number;
  autoFlip?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function CardFlip({
  card,
  isReversed = false,
  index = 0,
  delay = 0,
  autoFlip = false,
  onClick,
  className = '',
}: Props) {
  const [flipped, setFlipped] = useState(autoFlip);

  const handleClick = () => {
    setFlipped(true);
    onClick?.();
  };

  const cardWidth = 90;
  const cardHeight = 140;

  return (
    <div
      className={`inline-block cursor-pointer ${className}`}
      style={{
        width: cardWidth,
        height: cardHeight,
        perspective: '800px',
        animation: autoFlip ? `fadeInUp 0.6s ease-out ${delay * 0.3}s both` : undefined,
      }}
      onClick={handleClick}
    >
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front (back of card) */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardBack />
        </div>

        {/* Back (face of card) */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <CardFace card={card} isReversed={isReversed} />
        </div>
      </div>

      {!flipped && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300"
          style={{
            boxShadow: '0 0 20px rgba(212,168,83,0.2)',
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
}