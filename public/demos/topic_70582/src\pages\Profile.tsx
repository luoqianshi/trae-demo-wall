import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import RouteCard from '@/components/RouteCard';
import {
  User,
  Heart,
  Clock,
  Award,
  Settings,
  LogOut,
  MapPin,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

type TabType = 'favorites' | 'history' | 'badges';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoggedIn, favorites, searchHistory, badges, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  if (!user) return null;

  const tabs = [
    { key: 'favorites' as TabType, label: '我的收藏', icon: Heart },
    { key: 'history' as TabType, label: '搜索历史', icon: Clock },
    { key: 'badges' as TabType, label: '成就徽章', icon: Award },
  ];

  const levelProgress = (user.points % 2000) / 2000 * 100;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream pt-20 pb-24">
      <div className="bg-gradient-hero pt-8 pb-24">
        <div className="container mx-auto px-4">
          <div className={`flex items-start gap-4 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-20 h-20 rounded-2xl border-4 border-white/30 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold-400 rounded-full flex items-center justify-center text-xs font-bold text-primary-800 shadow-md">
                Lv.{user.level}
              </div>
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-2xl font-bold text-white mb-1 font-display">
                {user.username}
              </h1>
              <p className="text-white/60 text-sm mb-3">{user.email}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-gold-300" />
                  <span className="text-white font-semibold">{user.points}</span>
                  <span className="text-white/60 text-sm">里程</span>
                </div>
              </div>
            </div>
            <button className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors">
              <Settings size={20} />
            </button>
          </div>

          <div className={`mt-6 ${isVisible ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between text-xs text-white/70 mb-2">
              <span>Lv.{user.level}</span>
              <span>Lv.{user.level + 1}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-300 to-gold-500 rounded-full transition-all duration-1000"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/50 mt-1.5">
              再获得 {2000 - (user.points % 2000)} 里程升级
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-card card-hover">
            <div className="text-2xl font-bold text-accent-500 font-display">{favorites.length}</div>
            <div className="text-xs text-primary-700/50 mt-1">收藏路线</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-card card-hover">
            <div className="text-2xl font-bold text-tealish-500 font-display">{searchHistory.length}</div>
            <div className="text-xs text-primary-700/50 mt-1">搜索记录</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-card card-hover">
            <div className="text-2xl font-bold text-gold-500 font-display">
              {badges.filter(b => b.unlocked).length}
            </div>
            <div className="text-xs text-primary-700/50 mt-1">已解锁徽章</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all relative ${
                    activeTab === tab.key
                      ? 'text-accent-500'
                      : 'text-primary-700/50 hover:text-primary-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4">
            {activeTab === 'favorites' && (
              <div className="animate-fade-in">
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">💝</div>
                    <h3 className="text-lg font-medium text-primary-800 mb-1">还没有收藏</h3>
                    <p className="text-sm text-primary-700/50 mb-4">去发现有趣的中转方案吧</p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-2 bg-accent-500 text-white text-sm rounded-full hover:shadow-glow transition-all"
                    >
                      去看看
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((fav, index) => (
                      <RouteCard key={fav.id} route={fav.route} index={index} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-fade-in">
                {searchHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🔍</div>
                    <h3 className="text-lg font-medium text-primary-800 mb-1">暂无搜索记录</h3>
                    <p className="text-sm text-primary-700/50">开始搜索你的第一个中转方案</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 hover:bg-primary-50/50 rounded-xl transition-colors cursor-pointer group"
                        onClick={() => navigate('/search')}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                          <MapPin size={18} className="text-primary-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-primary-800">
                            {item.from} → {item.to}
                          </div>
                          <div className="text-xs text-primary-700/50">{item.date}</div>
                        </div>
                        <ChevronRight size={18} className="text-primary-300 group-hover:text-primary-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl text-center transition-all ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-gold-300/20 to-amber-100 border border-gold-300/30'
                          : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className={`text-4xl mb-2 ${badge.unlocked ? '' : 'grayscale'}`}>
                        {badge.icon}
                      </div>
                      <div className="text-sm font-semibold text-primary-800 mb-1">
                        {badge.name}
                      </div>
                      <div className="text-xs text-primary-700/50 mb-2">
                        {badge.description}
                      </div>
                      {!badge.unlocked && (
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold-400 rounded-full"
                            style={{ width: `${badge.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
          <Link
            to="/community"
            className="flex items-center gap-3 p-4 hover:bg-primary-50/30 transition-colors border-b border-gray-50"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
              <Sparkles size={18} className="text-accent-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-primary-800">发布实测路线</div>
              <div className="text-xs text-primary-700/50">分享你的中转体验，赚取里程积分</div>
            </div>
            <ChevronRight size={18} className="text-primary-300" />
          </Link>
          <Link
            to="/favorites"
            className="flex items-center gap-3 p-4 hover:bg-primary-50/30 transition-colors border-b border-gray-50"
          >
            <div className="w-10 h-10 rounded-xl bg-tealish-400/10 flex items-center justify-center">
              <Heart size={18} className="text-tealish-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-primary-800">我的收藏</div>
              <div className="text-xs text-primary-700/50">{favorites.length} 条收藏的路线</div>
            </div>
            <ChevronRight size={18} className="text-primary-300" />
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-4 bg-white rounded-2xl shadow-card text-red-500 font-medium hover:bg-red-50/50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>
    </div>
  );
}
