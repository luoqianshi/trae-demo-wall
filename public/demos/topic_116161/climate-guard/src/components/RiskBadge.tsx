import { cn } from '../utils/cn';
import type { RiskLevel, RiskMode } from '../types';

interface Props {
  level: RiskLevel;
  mode?: RiskMode;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export default function RiskBadge({ level, mode, size = 'md', pulse = false }: Props) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const levelColors = {
    '低': 'bg-safe/15 text-safe border-safe/25',
    '中': 'bg-heat-low/15 text-heat-low border-heat-low/25',
    '高': 'bg-heat-high/15 text-heat-high border-heat-high/25',
    '极高': 'bg-heat-extreme/15 text-heat-extreme border-heat-extreme/25',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-semibold',
      sizeClasses[size],
      levelColors[level],
      pulse && level === '极高' && 'animate-pulse-slow'
    )}>
      {level === '极高' && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
      {mode && <span>{mode}</span>}
      {mode && <span className="opacity-40">·</span>}
      <span>{level}风险</span>
    </span>
  );
}
