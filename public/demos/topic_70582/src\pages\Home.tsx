import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import RouteCard from '@/components/RouteCard';
import { mockRoutes, mockSharedRoutes } from '@/data/mockData';
import { Sparkles, TrendingUp, Users, ArrowRight, Plane, Train, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const featuredRoutes = mockRoutes.slice(0, 4);
  const topShared = mockSharedRoutes.slice(0, 3);

  const features = [
    {
      icon: <Plane className="text-accent-500" size={28} />,
      title: '回旋镖航线',
      desc: '经停第三城市，省一半机票钱还能额外游玩',
    },
    {
      icon: <Train className="text-tealish-500" size={28} />,
      title: '同车接续',
      desc: '高铁同站换乘，无缝衔接比直达还便宜',
    },
    {
      icon: <Map className="text-gold-500" size={28} />,
      title: '开口程方案',
      desc: '去程回程不同城市，一次旅行玩更多地方',
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <section className="relative bg-gradient-hero pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-accent-400 filter blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-tealish-400 filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold-300/30 filter blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className={`text-center mb-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-6">
              <Sparkles size={16} className="text-gold-300" />
              <span>发现更省钱的中转出行方案</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              换个<span className="text-gradient">中转思路</span>
              <br />
              省出一趟旅行钱
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              回旋镖航线 · 开口程方案 · 同车接续
              <br className="md:hidden" />
              发现更有趣更省钱的出行方式
            </p>
          </div>

          <div className={`max-w-4xl mx-auto ${isVisible ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      <section className="py-12 -mt-8 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 shadow-card card-hover ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-primary-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-primary-700/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="text-accent-500" size={20} />
                <span className="text-sm text-accent-500 font-medium">热门推荐</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-800">
                精选中转方案
              </h2>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all"
            >
              查看全部
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredRoutes.map((route, index) => (
              <RouteCard key={route.id} route={route} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-b from-white to-primary-50/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="text-gold-500" size={20} />
                <span className="text-sm text-gold-600 font-medium">为你推荐</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-800">
                猜你喜欢
              </h2>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all"
            >
              换一批
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredRoutes.slice(1, 4).map((route, index) => (
              <RouteCard key={route.id + '-rec'} route={route} index={index} />
            ))}
            <div className="bg-gradient-to-br from-accent-500 to-accent-400 rounded-2xl p-6 text-white flex flex-col justify-between card-hover">
              <div>
                <div className="text-3xl mb-3">✨</div>
                <h3 className="text-xl font-bold mb-2">更多专属推荐</h3>
                <p className="text-white/80 text-sm">
                  登录后基于你的出行偏好，为你智能推荐更合适的中转方案
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 px-6 py-2.5 bg-white text-accent-500 font-semibold rounded-full text-sm hover:shadow-lg transition-all"
              >
                登录解锁更多
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-primary-50/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="text-tealish-500" size={20} />
                <span className="text-sm text-tealish-600 font-medium">社区实测</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-800">
                真实用户分享
              </h2>
            </div>
            <button
              onClick={() => navigate('/community')}
              className="flex items-center gap-1 text-accent-500 font-medium hover:gap-2 transition-all"
            >
              更多分享
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topShared.map((shared, index) => (
              <div
                key={shared.id}
                className="bg-white rounded-2xl p-5 shadow-card card-hover cursor-pointer"
                onClick={() => navigate('/community')}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={shared.avatar}
                    alt={shared.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-primary-800 text-sm">
                      {shared.username}
                    </div>
                    <div className="text-xs text-primary-700/50">{shared.createdAt}</div>
                  </div>
                </div>
                <h3 className="font-bold text-primary-800 mb-2 line-clamp-1">
                  {shared.title}
                </h3>
                <p className="text-sm text-primary-700/60 line-clamp-2 mb-4">
                  {shared.content}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {shared.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-primary-700/50">
                    <span>❤️ {shared.likes}</span>
                    <span>💬 {shared.comments.length}</span>
                    <span>⭐ {shared.saves}</span>
                  </div>
                  <div className="text-accent-500 font-bold text-sm">
                    ¥{shared.routePrice}起
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white filter blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            开始你的省钱之旅
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            加入路游者社区，发现更多省钱有趣的中转方案，分享你的实测体验赚取里程积分
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-white text-primary-700 font-semibold rounded-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            立即加入，免费注册
          </button>
        </div>
      </section>

      <footer className="bg-primary-900 text-white/60 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧭</span>
              <span className="font-display text-xl font-bold text-white">路游者</span>
            </div>
            <div className="text-sm">
              © 2026 路游者 · 让每一次出行都更有趣
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
