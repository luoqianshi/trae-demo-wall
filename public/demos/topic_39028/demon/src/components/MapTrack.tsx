import { MapPin, Navigation } from 'lucide-react';
import type { TravelDetail } from '../data/mockData';

interface MapTrackProps {
  track: TravelDetail['mapTrack'];
}

export function MapTrack({ track }: MapTrackProps) {
  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
      <div className="relative h-80 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(78,205,196,0.15)" strokeWidth="1" />
            </pattern>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#4ECDC4" />
            </linearGradient>
          </defs>
          <rect width="400" height="320" fill="url(#grid)" />

          <path
            d="M 60 240 Q 150 100 220 160 T 360 80"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="3"
            strokeDasharray="6,4"
            className="animate-pulse"
          />

          {track.points.map((point, idx) => {
            const x = 60 + (idx * 100) + (idx * 10);
            const y = 240 - (idx * 50);
            return (
              <g key={point.name}>
                <circle cx={x} cy={y} r="8" fill="white" stroke="#FF6B35" strokeWidth="3" />
                <circle cx={x} cy={y} r="3" fill="#FF6B35" />
                <text x={x} y={y - 18} textAnchor="middle" className="text-xs font-medium fill-gray-700">
                  {point.name}
                </text>
              </g>
            );
          })}

          <circle cx="60" cy="240" r="12" fill="#FF6B35" opacity="0.2" className="animate-ping" />
          <circle cx="360" cy="80" r="12" fill="#4ECDC4" opacity="0.2" className="animate-ping" />
        </svg>

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm flex items-center gap-2">
          <Navigation size={16} className="text-orange-500" />
          <span className="text-sm font-medium text-gray-700">Live Track</span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Travel Route</h3>
          <span className="text-sm text-gray-500">{track.points.length} stops</span>
        </div>
        <div className="space-y-2">
          {track.points.map((point, idx) => (
            <div key={point.name} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <MapPin size={14} className="text-orange-500" />
                <span>{point.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
