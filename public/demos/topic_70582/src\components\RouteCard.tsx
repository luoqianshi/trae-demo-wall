import { Clock, Star, Heart, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Route } from '@shared/types';
import { formatDuration, formatPrice, getRouteTypeTagClass, getTransportIcon, getTotalLayoverDuration } from '@/utils/format';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';

interface RouteCardProps {
  route: Route;
  index?: number;
}

// 获取停留时长等级
function getLayoverLevel(duration: number) {
  if (duration >= 720) {
    return {
      level: 'long',
      label: '深度游',
      icon: '🌟',
      badgeClass: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      highlightClass: 'ring-2 ring-purple-300 ring-offset-2',
      desc: '12小时以上',
    };
  }
  if (duration >= 360) {
    return {
      level: 'city',
      label: '市区游',
      icon: '🏙️',
      badgeClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      highlightClass: 'ring-2 ring-blue-300 ring-offset-2',
      desc: '6-12小时',
    };
  }
  if (duration >= 120) {
    return {
      level: 'medium',
      label: '长停留',
      icon: '☕',
      badgeClass: 'bg-green-100 text-green-700',
      highlightClass: '',
      desc: '2-6小时',
    };
  }
  return null;
}

export default function RouteCard({ route, index = 0 }: RouteCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, isLoggedIn } = useAuthStore();
  const [heartAnimating, setHeartAnimating] = useState(false);
  const favorited = isFavorite(route.id);

  const totalLayover = getTotalLayoverDuration(route.layovers);
  const layoverLevel = getLayoverLevel(totalLayover);
  const layoverCity = route.layovers[0]?.city || '';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setHeartAnimating(true);
    toggleFavorite(route.id);
    setTimeout(() => setHeartAnimating(false), 600);
  };

  return (
    <div
      onClick={() => navigate(`/route/${route.id}`)}
      className={`bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden card-hover group relative ${
        layoverLevel?.highlightClass || ''
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 长停留标签 - 右上角 */}
      {layoverLevel && (
        <div className={`absolute top-0 right-0 ${layoverLevel.badgeClass} px-3 py-1 text-xs font-medium rounded-bl-xl z-10 flex items-center gap-1`}>
          <span>{layoverLevel.icon}</span>
          <span>{layoverLevel.label}</span>
        </div>
      )}

      <div className={`p-5 ${layoverLevel ? 'pt-8' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`tag ${getRouteTypeTagClass(route.type)}`}>
              {route.typeLabel}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-medium">{route.rating}</span>
              <span className="text-xs text-gray-400">({route.reviewCount})</span>
            </div>
          </div>
          <button
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-full transition-all ${
              favorited
                ? 'text-accent-500 bg-accent-50'
                : 'text-gray-300 hover:text-accent-400 hover:bg-accent-50/50'
            } ${heartAnimating ? 'animate-pulse-heart' : ''}`}
          >
            <Heart size={18} fill={favorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="text-xl font-bold text-primary-800">{route.from}</div>
            <div className="text-xs text-primary-700/50">{route.segments[0]?.departureTime}</div>
          </div>
          
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="text-xs text-primary-700/40 mb-1">{formatDuration(route.totalDuration)}</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-accent-400" />
              <div className="w-12 md:w-16 h-0.5 bg-gradient-to-r from-accent-400 to-tealish-400 rounded-full relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <ChevronRight size={12} className="text-primary-400" />
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-tealish-400" />
            </div>
            <div className="text-xs text-primary-700/40 mt-1">
              {route.layovers.length}次中转
            </div>
          </div>

          <div className="flex-1 text-right">
            <div className="text-xl font-bold text-primary-800">{route.to}</div>
            <div className="text-xs text-primary-700/50">
              {route.segments[route.segments.length - 1]?.arrivalTime}
            </div>
          </div>
        </div>

        {/* 中转城市停留提示 */}
        {layoverLevel && layoverCity && (
          <div className={`mb-4 p-2 rounded-xl flex items-center gap-2 ${
            layoverLevel.level === 'long' 
              ? 'bg-purple-50/80 border border-purple-100' 
              : layoverLevel.level === 'city'
              ? 'bg-blue-50/80 border border-blue-100'
              : 'bg-green-50/80 border border-green-100'
          }`}>
            <MapPin size={14} className={
              layoverLevel.level === 'long'
                ? 'text-purple-500'
                : layoverLevel.level === 'city'
                ? 'text-blue-500'
                : 'text-green-500'
            } />
            <div className="flex-1 text-xs">
              <span className="font-medium text-primary-700">
                {layoverCity} {layoverLevel.desc}
              </span>
              <span className="text-primary-500/70 ml-1">
                可出站游玩
              </span>
            </div>
            <Sparkles size={14} className={
              layoverLevel.level === 'long'
                ? 'text-purple-400'
                : layoverLevel.level === 'city'
                ? 'text-blue-400'
                : 'text-green-400'
            } />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {route.highlights.slice(0, 2).map((highlight, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-primary-50/80 text-primary-600 rounded-lg"
            >
              {highlight}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-primary-700/60">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              停留{formatDuration(totalLayover)}
            </div>
            <div className="flex items-center gap-1">
              <span>{getTransportIcon(route.segments[0]?.type)}</span>
              {route.segments.map((s, i) => (
                <span key={i}>{getTransportIcon(s.type)}</span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-primary-700/40 line-through">
              {formatPrice(route.directPrice || 0)}
            </div>
            <div className="text-2xl font-bold text-accent-500 font-display">
              {formatPrice(route.totalPrice)}
            </div>
            <div className="text-xs text-green-500 font-medium">
              省{formatPrice(route.savings)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
