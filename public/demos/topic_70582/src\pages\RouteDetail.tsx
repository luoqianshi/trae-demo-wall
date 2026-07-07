import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockRoutes } from '@/data/mockData';
import {
  ArrowLeft,
  Heart,
  Clock,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Plane,
  Train,
  Coffee,
  TrendingDown,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  formatDuration,
  formatPrice,
  getTransportIcon,
  getRouteTypeTagClass,
  getTotalLayoverDuration,
} from '@/utils/format';

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, isLoggedIn } = useAuthStore();
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [showCompare, setShowCompare] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const route = mockRoutes.find((r) => r.id === id) || mockRoutes[0];
  const otherRoutes = mockRoutes.filter((r) => r.id !== id).slice(0, 3);
  const favorited = isFavorite(route.id);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleFavorite = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setHeartAnimating(true);
    toggleFavorite(route.id);
    setTimeout(() => setHeartAnimating(false), 600);
  };

  const totalLayover = getTotalLayoverDuration(route.layovers);

  const getTransportIconLucide = (type: string) => {
    return type === 'flight' ? Plane : Train;
  };

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16">
      <div className="bg-gradient-hero pt-6 pb-24 md:pb-32">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            返回
          </button>
          <div className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`tag ${getRouteTypeTagClass(route.type)}`}>
                {route.typeLabel}
              </span>
              <div className="flex items-center gap-1 text-gold-300">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-medium text-white">{route.rating}</span>
                <span className="text-sm text-white/50">({route.reviewCount}条评价)</span>
              </div>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
              {route.from} → {route.to}
            </h1>
            <div className="flex items-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                全程 {formatDuration(route.totalDuration)}
              </div>
              <div className="flex items-center gap-1">
                <Coffee size={16} />
                中转停留 {formatDuration(totalLayover)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className={`bg-white rounded-2xl shadow-card p-6 ${isVisible ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary-800">行程详情</h2>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-full hover:bg-primary-50 text-primary-600 transition-colors"
                    onClick={handleFavorite}
                  >
                    <Heart
                      size={20}
                      fill={favorited ? 'currentColor' : 'none'}
                      className={`${favorited ? 'text-accent-500' : ''} ${heartAnimating ? 'animate-pulse-heart' : ''}`}
                    />
                  </button>
                  <button className="p-2 rounded-full hover:bg-primary-50 text-primary-600 transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              <div className="relative">
                {route.segments.map((segment, segIndex) => {
                  const TransportIcon = getTransportIconLucide(segment.type);
                  return (
                    <div key={segment.id} className="relative">
                      {segIndex > 0 && (
                        <div className="absolute left-[22px] -top-2 w-0.5 h-6 bg-primary-200" />
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 z-10">
                          <TransportIcon size={20} />
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-primary-800">
                                {segment.carrier}
                              </span>
                              <span className="text-sm text-primary-700/50">
                                {segment.flightNo || segment.trainNo}
                              </span>
                            </div>
                            <span className="text-accent-500 font-medium">
                              {formatPrice(segment.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-2xl font-bold text-primary-800 font-display">
                                {segment.departureTime}
                              </div>
                              <div className="text-sm text-primary-700/60">{segment.from}</div>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                              <div className="text-xs text-primary-700/40 mb-1">
                                {formatDuration(segment.duration)}
                              </div>
                              <div className="w-full h-0.5 bg-gradient-to-r from-accent-400 to-tealish-400 rounded-full relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white">
                                  {getTransportIcon(segment.type)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary-800 font-display">
                                {segment.arrivalTime}
                              </div>
                              <div className="text-sm text-primary-700/60">{segment.to}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {segIndex < route.segments.length - 1 && route.layovers[segIndex] && (
                        <div className="ml-14 mb-4 -mt-2">
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-amber-700">
                                <Coffee size={16} />
                                <span className="font-medium text-sm">
                                  {route.layovers[segIndex].city} 中转停留
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-amber-700">
                                {formatDuration(route.layovers[segIndex].duration)}
                              </span>
                            </div>
                            <button
                              onClick={() => setShowTips(!showTips)}
                              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                            >
                              中转小贴士
                              {showTips ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {showTips && (
                              <div className="mt-3 space-y-1.5 animate-fade-in">
                                {route.layovers[segIndex].tips?.map((tip, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-amber-700/80">
                                    <span className="text-amber-500 mt-0.5">•</span>
                                    {tip}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className={`bg-white rounded-2xl shadow-card p-6 ${isVisible ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary-800">亮点与须知</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {route.highlights.map((highlight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-primary-50/50 rounded-xl"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <TrendingDown size={14} className="text-accent-500" />
                    </div>
                    <span className="text-sm text-primary-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`bg-white rounded-2xl shadow-card p-6 ${isVisible ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}
            >
              <h2 className="text-lg font-bold text-primary-800 mb-4">其他可选方案</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {otherRoutes.map((other) => (
                  <Link
                    key={other.id}
                    to={`/route/${other.id}`}
                    className="p-4 bg-primary-50/30 rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`tag ${getRouteTypeTagClass(other.type)}`}>
                        {other.typeLabel}
                      </span>
                      <span className="text-accent-500 font-bold">
                        {formatPrice(other.totalPrice)}
                      </span>
                    </div>
                    <div className="text-sm text-primary-700/60">
                      {other.from} → {other.to}
                    </div>
                    <div className="text-xs text-primary-700/40 mt-1">
                      全程 {formatDuration(other.totalDuration)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className={`bg-white rounded-2xl shadow-card p-6 sticky top-24 ${isVisible ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-primary-700/50">中转方案价格</span>
              </div>
              <div className="text-4xl font-bold text-accent-500 font-display mb-2">
                {formatPrice(route.totalPrice)}
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-primary-700/40 line-through">
                  {formatPrice(route.directPrice || 0)}
                </span>
                <span className="text-sm text-green-500 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  省{formatPrice(route.savings)}
                </span>
              </div>

              <button className="w-full py-3.5 bg-gradient-to-r from-accent-500 to-accent-400 text-white font-semibold rounded-xl hover:shadow-glow transition-all duration-300 mb-3">
                立即预订
              </button>
              <button
                onClick={handleFavorite}
                className="w-full py-3 border-2 border-primary-200 text-primary-700 font-medium rounded-xl hover:border-primary-300 hover:bg-primary-50/50 transition-all"
              >
                {favorited ? '已收藏' : '收藏方案'}
              </button>
            </div>

            <div
              className={`bg-white rounded-2xl shadow-card overflow-hidden ${isVisible ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}
            >
              <button
                onClick={() => setShowCompare(!showCompare)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary-50/30 transition-colors"
              >
                <h3 className="font-bold text-primary-800">对比直达方案</h3>
                {showCompare ? <ChevronUp size={20} className="text-primary-500" /> : <ChevronDown size={20} className="text-primary-500" />}
              </button>
              {showCompare && (
                <div className="px-6 pb-6 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary-50/50 rounded-xl text-center">
                      <div className="text-xs text-primary-700/50 mb-2">直达方案</div>
                      <div className="text-2xl font-bold text-primary-800 font-display">
                        {formatPrice(route.directPrice || 0)}
                      </div>
                      <div className="text-sm text-primary-700/50 mt-2">
                        {formatDuration(route.directDuration || 0)}
                      </div>
                    </div>
                    <div className="p-4 bg-accent-50 rounded-xl text-center border-2 border-accent-200">
                      <div className="text-xs text-accent-600 mb-2 font-medium">中转方案</div>
                      <div className="text-2xl font-bold text-accent-500 font-display">
                        {formatPrice(route.totalPrice)}
                      </div>
                      <div className="text-sm text-accent-600/70 mt-2">
                        {formatDuration(route.totalDuration)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-700/60">价格差</span>
                      <span className="text-green-500 font-medium">
                        节省 {formatPrice(route.savings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-700/60">时间差</span>
                      <span className="text-amber-600">
                        多用 {formatDuration(route.extraTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-700/60">每小时价值</span>
                      <span className="text-primary-700 font-medium">
                        {Math.round(route.savings / (route.extraTime / 60))}元/小时
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        中转方案虽耗时更长，但可省下 {formatPrice(route.savings)}，
                        还能体验{route.layovers[0]?.city}的美食与风景~
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`bg-gradient-to-br from-primary-700 to-primary-800 rounded-2xl p-6 text-white ${isVisible ? 'animate-fade-in-up delay-400' : 'opacity-0'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <MapPin size={18} className="text-gold-300" />
                </div>
                <span className="font-medium">中转体验攻略</span>
              </div>
              <p className="text-sm text-white/70 mb-4">
                看看其他用户在 {route.layovers[0]?.city} 中转的真实体验
              </p>
              <button
                onClick={() => navigate('/community')}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
              >
                查看社区攻略
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
