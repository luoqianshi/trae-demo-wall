import type { Card } from '@/../shared/types';

interface Props {
  card: Card;
  isReversed?: boolean;
}

const suitColors: Record<string, { main: string; light: string }> = {
  wands: { main: '#c0392b', light: '#e74c3c' },
  cups: { main: '#2980b9', light: '#5dade2' },
  swords: { main: '#f1c40f', light: '#f9e79f' },
  pentacles: { main: '#27ae60', light: '#58d68d' },
};

const suitSymbols: Record<string, string> = {
  wands: '▲',
  cups: '♥',
  swords: '◆',
  pentacles: '●',
};

const majorSymbols = ['★', '☽', '☀', '✧', '⚝', '⬡', '⚕', '☿', '♃', '♄'];

export default function CardFace({ card, isReversed = false }: Props) {
  const isMajor = card.type === 'major';
  const suit = card.suit || 'wands';
  const colors = isMajor ? { main: '#7b2d8e', light: '#d4a853' } : suitColors[suit];
  const symbol = isMajor
    ? majorSymbols[card.number % majorSymbols.length]
    : suitSymbols[suit];

  return (
    <div
      className="w-full h-full rounded-lg flex flex-col items-center justify-between p-2 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${isMajor ? '#1a0a2e' : '#0d1b3e'}, ${isMajor ? '#2d1040' : '#0d0520'})`,
        border: `2px solid ${colors.main}`,
        boxShadow: `0 0 15px ${colors.main}33, inset 0 0 30px ${colors.main}11`,
        transform: isReversed ? 'rotate(180deg)' : 'none',
      }}
    >
      {/* Inner decorative border */}
      <div
        className="absolute inset-1 rounded-md pointer-events-none"
        style={{ border: `1px solid ${colors.light}33` }}
      />

      {/* Ornamental corners */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-3 h-3 pointer-events-none`}
          style={{
            borderTop: i < 2 ? `1px solid ${colors.light}66` : 'none',
            borderBottom: i >= 2 ? `1px solid ${colors.light}66` : 'none',
            borderLeft: i % 2 === 0 ? `1px solid ${colors.light}66` : 'none',
            borderRight: i % 2 === 1 ? `1px solid ${colors.light}66` : 'none',
            margin: '4px',
          }}
        />
      ))}

      {/* Top: number and suit */}
      <div className="flex items-center justify-between w-full px-1 z-10">
        <span className="text-xs font-bold" style={{ color: colors.light }}>
          {isMajor ? card.number : `${card.number}`}
        </span>
        <span className="text-xs" style={{ color: colors.light, opacity: 0.7 }}>
          {symbol}
        </span>
      </div>

      {/* Center: main symbol */}
      <div className="flex-1 flex items-center justify-center z-10">
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: '60%',
            height: '60%',
            maxWidth: '80px',
            maxHeight: '80px',
            background: `radial-gradient(circle, ${colors.light}22, transparent)`,
            border: `2px solid ${colors.light}44`,
          }}
        >
          <span
            className="text-3xl"
            style={{ color: colors.light, textShadow: `0 0 10px ${colors.light}66` }}
          >
            {symbol}
          </span>
        </div>
      </div>

      {/* Bottom: name */}
      <div className="w-full text-center z-10 pb-1">
        <span
          className="text-xs font-medium tracking-wider"
          style={{ color: colors.light }}
        >
          {card.name}
        </span>
      </div>
    </div>
  );
}