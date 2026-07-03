export default function CardBack() {
  return (
    <div
      className="w-full h-full rounded-lg flex items-center justify-center overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1040 50%, #1a0a2e 100%)',
        border: '2px solid #d4a853',
        boxShadow: '0 0 15px rgba(212,168,83,0.2), inset 0 0 30px rgba(212,168,83,0.05)',
      }}
    >
      {/* Inner border */}
      <div
        className="absolute inset-1.5 rounded-md"
        style={{ border: '1px solid rgba(212,168,83,0.3)' }}
      />

      {/* Star of David / geometric pattern */}
      <div className="relative w-3/5 h-3/5 flex items-center justify-center">
        {/* Outer hexagram */}
        <div
          className="absolute"
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid rgba(212,168,83,0.4)',
            borderRadius: '20%',
            transform: 'rotate(45deg)',
          }}
        />
        {/* Triangle up */}
        <svg viewBox="0 0 100 100" className="absolute w-3/4 h-3/4">
          <polygon
            points="50,5 95,85 5,85"
            fill="none"
            stroke="rgba(212,168,83,0.5)"
            strokeWidth="1"
          />
        </svg>
        {/* Triangle down */}
        <svg viewBox="0 0 100 100" className="absolute w-3/4 h-3/4">
          <polygon
            points="50,95 95,15 5,15"
            fill="none"
            stroke="rgba(212,168,83,0.5)"
            strokeWidth="1"
          />
        </svg>
        {/* Inner circle */}
        <div
          className="absolute rounded-full"
          style={{
            width: '35%',
            height: '35%',
            border: '1px solid rgba(212,168,83,0.5)',
            background: 'radial-gradient(circle, rgba(123,45,142,0.3), transparent)',
          }}
        />
        {/* Eye symbol */}
        <div className="absolute flex items-center justify-center" style={{ fontSize: '16px' }}>
          <span style={{ color: '#d4a853', textShadow: '0 0 8px rgba(212,168,83,0.6)' }}>◉</span>
        </div>
      </div>

      {/* Ornamental corners */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-4 h-4 m-2`} style={{ opacity: 0.5 }}>
          <svg viewBox="0 0 20 20" className="w-full h-full">
            <path
              d="M0,0 L8,0 Q10,2 12,0 L20,0 L20,10 L0,10 Z"
              fill="none"
              stroke="rgba(212,168,83,0.4)"
              strokeWidth="0.5"
              transform={
                i === 0 ? '' :
                i === 1 ? 'scale(-1,1)' :
                i === 2 ? 'scale(1,-1)' :
                'scale(-1,-1)'
              }
              style={{ transformOrigin: '10px 10px' }}
            />
          </svg>
        </div>
      ))}

      {/* Decorative dots on border */}
      {Array.from({ length: 12 }).map((_, i) => {
        const pct = (i / 12) * 100;
        return (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: 'rgba(212,168,83,0.4)',
              top: i < 6 ? '0' : '100%',
              left: i < 6 ? `${pct}%` : `${pct}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </div>
  );
}