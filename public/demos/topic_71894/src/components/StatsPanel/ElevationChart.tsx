import { useMemo } from 'react';
import type { RoutePoint } from '../../types';

interface ElevationChartProps {
  points: RoutePoint[];
  height?: number;
}

export function ElevationChart({ points, height = 120 }: ElevationChartProps) {
  const { pathData, areaPath, elevationRange, distanceRange } = useMemo(() => {
    if (points.length < 2) {
      return {
        pathData: '',
        areaPath: '',
        elevationRange: { min: 0, max: 0 },
        distanceRange: 0,
      };
    }

    const elevations = points
      .filter((p) => p.elevation !== undefined)
      .map((p) => p.elevation!);
    
    if (elevations.length === 0) {
      return {
        pathData: '',
        areaPath: '',
        elevationRange: { min: 0, max: 0 },
        distanceRange: 0,
      };
    }

    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const elevRange = Math.max(1, maxElev - minElev);
    const totalDist = points[points.length - 1].distance || 0;

    const width = 280;
    const chartHeight = height - 20;
    const padding = { top: 10, bottom: 10, left: 0, right: 0 };

    const coords = points.map((p, i) => {
      const x = padding.left + ((p.distance || 0) / Math.max(1, totalDist)) * (width - padding.left - padding.right);
      const y = padding.top + chartHeight - ((p.elevation! - minElev) / elevRange) * chartHeight;
      return { x, y, elev: p.elevation!, dist: p.distance || 0 };
    });

    let path = '';
    coords.forEach((c, i) => {
      if (i === 0) {
        path += `M ${c.x} ${c.y}`;
      } else {
        const prev = coords[i - 1];
        const cpx1 = prev.x + (c.x - prev.x) / 3;
        const cpx2 = prev.x + ((c.x - prev.x) * 2) / 3;
        path += ` C ${cpx1} ${prev.y}, ${cpx2} ${c.y}, ${c.x} ${c.y}`;
      }
    });

    const area = `${path} L ${coords[coords.length - 1].x} ${padding.top + chartHeight} L ${coords[0].x} ${padding.top + chartHeight} Z`;

    return {
      pathData: path,
      areaPath: area,
      elevationRange: { min: minElev, max: maxElev },
      distanceRange: totalDist,
    };
  }, [points, height]);

  if (!pathData) {
    return (
      <div
        className="bg-slate-800/30 rounded-xl flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        暂无海拔数据
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 rounded-xl p-3">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 280 ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="elevGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        <path d={areaPath} fill="url(#elevGradient)" />
        <path
          d={pathData}
          fill="none"
          stroke="#0EA5E9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
        <span>0m</span>
        <span>
          {distanceRange >= 1000
            ? `${(distanceRange / 1000).toFixed(1)}km`
            : `${distanceRange.toFixed(0)}m`}
        </span>
      </div>
    </div>
  );
}
