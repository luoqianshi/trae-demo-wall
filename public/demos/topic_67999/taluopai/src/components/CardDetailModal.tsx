import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Card } from '@/../shared/types';

interface Props {
  card: Card | null;
  isOpen: boolean;
  isReversed?: boolean;
  onClose: () => void;
}

export default function CardDetailModal({ card, isOpen, isReversed, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  const isMajor = card.type === 'major';
  const accentColor = isMajor ? '#d4a853' : '#7b2d8e';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="glass rounded-2xl p-6 max-w-md w-full relative animate-scaleIn"
        style={{
          border: `2px solid ${accentColor}44`,
          boxShadow: `0 0 40px ${accentColor}22`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-mystic-gold/10 transition-colors"
        >
          <X size={18} className="text-mystic-gold" />
        </button>

        {/* Decorative symbol */}
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: `radial-gradient(circle, ${accentColor}22, transparent)`,
              border: `2px solid ${accentColor}44`,
              color: accentColor,
              textShadow: `0 0 10px ${accentColor}66`,
            }}
          >
            {isMajor ? '★' : card.suit === 'wands' ? '▲' : card.suit === 'cups' ? '♥' : card.suit === 'swords' ? '◆' : '●'}
          </div>
        </div>

        {/* Card name */}
        <h2 className="text-2xl font-display text-center text-mystic-gold mb-1">
          {card.name}
        </h2>
        <p className="text-sm text-center text-mystic-silver/60 mb-1 font-body italic">
          {card.nameEn}
        </p>

        {isReversed && (
          <p className="text-xs text-center text-red-400/80 mb-2">逆位</p>
        )}

        {/* Keywords */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          {card.keywords.split(/[,，;；]/).filter(Boolean).map((kw, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                background: `${accentColor}15`,
                color: accentColor,
                border: `1px solid ${accentColor}33`,
              }}
            >
              {kw.trim()}
            </span>
          ))}
        </div>

        {/* Meaning */}
        <div className="space-y-3">
          <div className="glass rounded-lg p-3">
            <h3 className="text-sm font-display text-mystic-gold mb-1">
              {isReversed ? '逆位含义' : '正位含义'}
            </h3>
            <p className="text-sm text-mystic-silver/80 leading-relaxed">
              {isReversed ? card.meaningReversed : card.meaningUpright}
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex justify-center gap-4 mt-4 text-xs text-mystic-silver/50">
          {card.element && <span>元素：{card.element}</span>}
          {card.zodiac && <span>星座：{card.zodiac}</span>}
          <span>编号：{card.number}</span>
        </div>
      </div>
    </div>
  );
}