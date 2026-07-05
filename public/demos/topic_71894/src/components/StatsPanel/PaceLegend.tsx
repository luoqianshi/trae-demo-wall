export function PaceLegend() {
  const paceRanges = [
    { color: '#EF4444', label: '< 5:00', desc: '冲刺' },
    { color: '#F97316', label: '5:00-6:00', desc: '快跑' },
    { color: '#EAB308', label: '6:00-7:00', desc: '节奏跑' },
    { color: '#22C55E', label: '7:00-8:00', desc: '轻松跑' },
    { color: '#0EA5E9', label: '8:00-9:00', desc: '慢跑' },
    { color: '#8B5CF6', label: '> 9:00', desc: '步行' },
  ];

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-400">配速图例</div>
      <div className="grid grid-cols-2 gap-2">
        {paceRanges.map((range) => (
          <div
            key={range.label}
            className="flex items-center gap-2 bg-slate-800/30 rounded-lg px-2 py-1.5"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: range.color }}
            />
            <div className="min-w-0">
              <div className="text-xs text-white font-medium truncate">
                {range.label}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{range.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
