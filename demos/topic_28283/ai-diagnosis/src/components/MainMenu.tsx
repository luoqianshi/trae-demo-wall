import { useEffect, useState } from 'react';

interface MainMenuProps {
  onStart: () => void;
}

export default function MainMenu({ onStart }: MainMenuProps) {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
         style={{ background: 'linear-gradient(180deg, #5C94FC 0%, #3C74DC 100%)' }}>

      {/* 装饰云朵 */}
      <div className="absolute top-12 left-16 opacity-80">
        <Cloud size={0.8} />
      </div>
      <div className="absolute top-20 right-24 opacity-70">
        <Cloud size={1.0} />
      </div>
      <div className="absolute top-8 left-1/2 opacity-60">
        <Cloud size={0.6} />
      </div>

      {/* 地面装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-16"
           style={{ backgroundColor: '#C84C0C' }}>
        <div className="h-4" style={{ backgroundColor: '#00A800' }}></div>
      </div>

      {/* 标题 */}
      <div className="mb-12 relative">
        <h1 className="text-5xl font-bold tracking-wider"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#E52521',
              textShadow: '4px 4px 0 #000, -1px -1px 0 #FCA044, 2px 2px 0 #AC7C00',
              animation: 'float 3s ease-in-out infinite',
            }}>
          SUPER
        </h1>
        <h1 className="text-5xl font-bold tracking-wider mt-4"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#FCA044',
              textShadow: '4px 4px 0 #000, -1px -1px 0 #E52521, 2px 2px 0 #AC7C00',
              animation: 'float 3s ease-in-out infinite 0.5s',
            }}>
          MARIO
        </h1>
      </div>

      {/* 马里奥像素图 */}
      <div className="mb-8">
        <PixelMario />
      </div>

      {/* 开始按钮 */}
      <button
        onClick={onStart}
        className="px-8 py-3 text-lg font-bold tracking-wider transition-all duration-150 hover:scale-105 active:scale-95"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          color: blink ? '#FFFFFF' : '#5C94FC',
          backgroundColor: '#E52521',
          border: '4px solid #AC7C00',
          borderBottom: '6px solid #000',
          textShadow: '2px 2px 0 #000',
          boxShadow: '0 4px 0 #000',
        }}>
        START GAME
      </button>

      {/* 操作说明 */}
      <div className="mt-8 text-center"
           style={{
             fontFamily: '"Press Start 2P", monospace',
             color: '#FFFFFF',
             textShadow: '2px 2px 0 #000',
             fontSize: '10px',
             lineHeight: '2',
           }}>
        <p>← → / A D  移动</p>
        <p>SPACE / W  跳跃</p>
        <p>SHIFT  跑步</p>
        <p>ESC  暂停</p>
      </div>

      {/* 版权信息 */}
      <p className="absolute bottom-20 text-xs opacity-60"
         style={{ fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF' }}>
        WEB TRIBUTE GAME
      </p>
    </div>
  );
}

function Cloud({ size = 1 }: { size?: number }) {
  return (
    <svg width={80 * size} height={40 * size} viewBox="0 0 80 40">
      <circle cx="20" cy="25" r="12" fill="white" />
      <circle cx="40" cy="18" r="16" fill="white" />
      <circle cx="60" cy="25" r="12" fill="white" />
      <rect x="20" y="25" width="40" height="12" fill="white" />
    </svg>
  );
}

function PixelMario() {
  const pixels = [
    [0,0,0,1,1,1,1,0],
    [0,0,1,1,1,1,1,1],
    [0,0,3,3,2,2,3,0],
    [0,3,2,3,2,2,3,2],
    [0,3,2,3,3,2,2,2],
    [0,0,3,2,2,2,3,0],
    [0,0,2,2,2,2,2,0],
    [0,0,2,2,0,2,2,0],
  ];
  const palette: Record<number, string> = {
    1: '#E52521', 2: '#FCA044', 3: '#AC7C00',
  };
  const scale = 5;
  return (
    <svg width={8 * scale} height={8 * scale}>
      {pixels.map((row, y) =>
        row.map((val, x) =>
          val > 0 ? (
            <rect
              key={`${y}-${x}`}
              x={x * scale}
              y={y * scale}
              width={scale}
              height={scale}
              fill={palette[val]}
            />
          ) : null
        )
      )}
    </svg>
  );
}
