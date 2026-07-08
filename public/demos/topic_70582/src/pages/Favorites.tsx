import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import RouteCard from '@/components/RouteCard';
import { Heart, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, isLoggedIn } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-cream pt-20 pb-24">
      <div className="bg-gradient-hero pt-6 pb-16">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            返回
          </button>
          <div className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Heart size={24} className="text-accent-400" fill="currentColor" />
              <h1 className="font-display text-3xl font-bold text-white">我的收藏</h1>
            </div>
            <p className="text-white/70">
              共收藏 {favorites.length} 条中转方案
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center animate-fade-in-up">
            <div className="text-6xl mb-4">💝</div>
            <h3 className="text-xl font-bold text-primary-800 mb-2">还没有收藏的路线</h3>
            <p className="text-primary-700/50 mb-6">去发现有趣的省钱中转方案吧</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-gradient-to-r from-accent-500 to-accent-400 text-white font-medium rounded-full hover:shadow-glow transition-all"
            >
              去探索
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((fav, index) => (
              <RouteCard key={fav.id} route={fav.route} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
