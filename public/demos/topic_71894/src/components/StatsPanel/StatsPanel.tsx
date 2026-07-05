import { useState, useRef, useEffect } from 'react';
import {
  Activity,
  MapPin,
  Timer,
  TrendingUp,
  Heart,
  Footprints,
  Flame,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';
import { formatDistance, formatDuration, formatPace } from '../../utils/sportsData';
import { ElevationChart } from './ElevationChart';
import { PaceLegend } from './PaceLegend';

export function StatsPanel() {
  const {
    stats,
    displayPoints,
    isStatsPanelOpen,
    statsPanelPosition,
    toggleStatsPanel,
    setStatsPanelPosition,
  } = useRouteStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 340, dragStartRef.current.panelX + dx));
      const newY = Math.max(80, Math.min(window.innerHeight - 100, dragStartRef.current.panelY + dy));
      
      setStatsPanelPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setStatsPanelPosition]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: statsPanelPosition.x,
      panelY: statsPanelPosition.y,
    };
  };

  if (displayPoints.length < 2) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-[999] w-80 transition-all duration-300"
      style={{
        left: statsPanelPosition.x,
        top: statsPanelPosition.y,
      }}
    >
      <div className="glass-panel rounded-2xl overflow-hidden animate-slide-up">
        <div
          className="flex items-center justify-between px-4 py-3 bg-slate-800/30 border-b border-slate-700/40 cursor-move select-none group"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity size={14} className="text-sky-400" />
              路线统计
            </span>
          </div>
          <button
            onClick={toggleStatsPanel}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            {isStatsPanelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {isStatsPanelOpen && (
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard
                icon={<MapPin size={15} />}
                label="总距离"
                value={formatDistance(stats.totalDistance)}
                color="text-sky-400"
                bgColor="bg-sky-500/10"
              />
              <StatCard
                icon={<Timer size={15} />}
                label="总时长"
                value={formatDuration(stats.totalTime)}
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
              />
              <StatCard
                icon={<Activity size={15} />}
                label="平均配速"
                value={`${formatPace(stats.avgPace)}`}
                color="text-orange-400"
                bgColor="bg-orange-500/10"
              />
              <StatCard
                icon={<Flame size={15} />}
                label="卡路里"
                value={`${Math.round(stats.calories)}`}
                color="text-red-400"
                bgColor="bg-red-500/10"
              />
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <TrendingUp size={13} />
                海拔数据
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ElevStat label="爬升" value={`+${stats.elevationGain.toFixed(0)}m`} color="text-emerald-400" />
                <ElevStat label="下降" value={`-${stats.elevationLoss.toFixed(0)}m`} color="text-red-400" />
                <ElevStat label="最高" value={`${stats.maxElevation.toFixed(0)}m`} color="text-white" />
                <ElevStat label="最低" value={`${stats.minElevation.toFixed(0)}m`} color="text-white" />
              </div>
            </div>

            {displayPoints.some((p) => p.elevation !== undefined) && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400">海拔剖面</div>
                <div className="bg-slate-800/40 rounded-xl p-2">
                  <ElevationChart points={displayPoints} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <StatCard
                icon={<Heart size={15} />}
                label="平均心率"
                value={`${Math.round(stats.avgHeartRate)}`}
                unit=" bpm"
                color="text-red-400"
                bgColor="bg-red-500/10"
              />
              <StatCard
                icon={<Footprints size={15} />}
                label="平均步频"
                value={`${Math.round(stats.avgCadence)}`}
                unit=" spm"
                color="text-violet-400"
                bgColor="bg-violet-500/10"
              />
            </div>

            <PaceLegend />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-3 border border-slate-700/20`}>
      <div className={`flex items-center gap-1.5 text-xs mb-1 ${color}`}>
        {icon}
        <span className="text-slate-500">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">
        {value}
        {unit && <span className="text-xs font-normal text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function ElevStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/20">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-base font-bold ${color}`}>{value}</div>
    </div>
  );
}
