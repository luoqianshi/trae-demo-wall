export default function MysticCircle() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Outer ring */}
      <div
        className="absolute rounded-full border border-amber-500/10 animate-magic-spin"
        style={{ width: 'min(80vw, 80vh)', height: 'min(80vw, 80vh)' }}
      />
      {/* Second ring */}
      <div
        className="absolute rounded-full border border-amber-500/8 animate-magic-spin"
        style={{
          width: 'min(70vw, 70vh)',
          height: 'min(70vw, 70vh)',
          animationDirection: 'reverse',
          animationDuration: '12s',
        }}
      />
      {/* Third ring */}
      <div
        className="absolute rounded-full border border-purple-400/10 animate-magic-spin"
        style={{
          width: 'min(60vw, 60vh)',
          height: 'min(60vw, 60vh)',
          animationDuration: '16s',
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute rounded-full border border-amber-500/10 animate-magic-spin"
        style={{
          width: 'min(50vw, 50vh)',
          height: 'min(50vw, 50vh)',
          animationDirection: 'reverse',
          animationDuration: '10s',
        }}
      />
      {/* Center dot */}
      <div
        className="absolute rounded-full bg-amber-500/5 animate-pulse-slow"
        style={{ width: 'min(10vw, 10vh)', height: 'min(10vw, 10vh)' }}
      />
      {/* Decorative dots on outer ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = `min(40vw, 40vh)`;
        return (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-500/30 animate-pulse-slow"
            style={{
              left: `calc(50% + ${r} * ${Math.cos(angle)})`,
              top: `calc(50% + ${r} * ${Math.sin(angle)})`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        );
      })}
      {/* Cross lines */}
      <div className="absolute w-[min(80vw,80vh)] h-[1px] bg-amber-500/5 rotate-45" />
      <div className="absolute w-[min(80vw,80vh)] h-[1px] bg-amber-500/5 -rotate-45" />
    </div>
  );
}