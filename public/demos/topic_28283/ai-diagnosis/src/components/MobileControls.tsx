interface MobileControlsProps {
  engine: { input: { setTouchControl: (control: 'left' | 'right' | 'jump' | 'run' | 'down', value: boolean) => void } } | null;
}

export default function MobileControls({ engine }: MobileControlsProps) {
  const setControl = (control: 'left' | 'right' | 'jump' | 'run' | 'down', value: boolean) => {
    engine?.input.setTouchControl(control, value);
  };

  const btnStyle: React.CSSProperties = {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '14px',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.4)',
    borderRadius: '8px',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 md:hidden z-30">
      {/* 左侧方向键 */}
      <div className="flex gap-2 items-end">
        <button
          style={{ ...btnStyle, width: 50, height: 50 }}
          onTouchStart={() => setControl('left', true)}
          onTouchEnd={() => setControl('left', false)}
          onMouseDown={() => setControl('left', true)}
          onMouseUp={() => setControl('left', false)}>
          ←
        </button>
        <div className="flex flex-col gap-1">
          <button
            style={{ ...btnStyle, width: 50, height: 35 }}
            onTouchStart={() => setControl('jump', true)}
            onTouchEnd={() => setControl('jump', false)}
            onMouseDown={() => setControl('jump', true)}
            onMouseUp={() => setControl('jump', false)}>
            ▲
          </button>
          <button
            style={{ ...btnStyle, width: 50, height: 35 }}
            onTouchStart={() => setControl('down', true)}
            onTouchEnd={() => setControl('down', false)}
            onMouseDown={() => setControl('down', true)}
            onMouseUp={() => setControl('down', false)}>
            ▼
          </button>
        </div>
        <button
          style={{ ...btnStyle, width: 50, height: 50 }}
          onTouchStart={() => setControl('right', true)}
          onTouchEnd={() => setControl('right', false)}
          onMouseDown={() => setControl('right', true)}
          onMouseUp={() => setControl('right', false)}>
          →
        </button>
      </div>

      {/* 右侧动作键 */}
      <div className="flex gap-2 items-end">
        <button
          style={{ ...btnStyle, width: 50, height: 50, backgroundColor: 'rgba(229,37,33,0.5)' }}
          onTouchStart={() => setControl('run', true)}
          onTouchEnd={() => setControl('run', false)}
          onMouseDown={() => setControl('run', true)}
          onMouseUp={() => setControl('run', false)}>
          B
        </button>
        <button
          style={{ ...btnStyle, width: 60, height: 60, backgroundColor: 'rgba(0,168,0,0.5)', fontSize: '16px' }}
          onTouchStart={() => setControl('jump', true)}
          onTouchEnd={() => setControl('jump', false)}
          onMouseDown={() => setControl('jump', true)}
          onMouseUp={() => setControl('jump', false)}>
          A
        </button>
      </div>
    </div>
  );
}
