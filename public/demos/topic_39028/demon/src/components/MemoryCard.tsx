import { useState } from 'react';
import { Heart, Calendar, Sparkles } from 'lucide-react';
import type { MemoryCard as MemoryCardType } from '../data/mockData';

interface MemoryCardProps {
  cards: MemoryCardType[];
}

export function MemoryCard({ cards }: MemoryCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {cards.map((card) => (
        <MemoryCardItem key={card.id} card={card} />
      ))}
    </div>
  );
}

function MemoryCardItem({ card }: { card: MemoryCardType }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="relative h-72 cursor-pointer perspective-1000 group"
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 preserve-3d ${
          flipped ? 'rotate-y-180' : ''
        }`}
      >
        <div className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-lg">
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Heart size={18} className="text-white" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <h4 className="text-xl font-bold mb-1">{card.title}</h4>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <Calendar size={12} />
              <span>{card.date}</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 p-6 flex flex-col justify-center text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} />
            <span className="text-xs font-medium uppercase tracking-wider opacity-90">Memory</span>
          </div>
          <h4 className="text-2xl font-bold mb-3">{card.title}</h4>
          <p className="text-sm leading-relaxed opacity-95">{card.description}</p>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
